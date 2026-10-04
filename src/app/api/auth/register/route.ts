import { NextResponse, after } from "next/server";
import { normPhone } from "@/backend/admin";
import { logActivity } from "@/backend/activity";
import { SESSION_SECONDS, USER_COOKIE, checkPasswordStrength, hashPassword, randomCode, sessionToken } from "@/backend/auth";
import { baseUrl, getSetting } from "@/backend/mail";
import { cols, hex, ObjectId, type User } from "@/backend/mongo";
import { notifyAdmin } from "@/backend/notify";
import { clientIp, cookieOptions, rateLimit, tooMany } from "@/backend/security";
import { nextVault } from "@/backend/vault";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = rateLimit(`reg:${clientIp(req)}`, 8, 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: tooMany(rl.retryAfter) }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim().slice(0, 80);
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const phone = String(b.phone ?? "").trim().slice(0, 30);
  const country = String(b.country ?? "").trim().slice(0, 80);
  const password = String(b.password ?? "");
  const ref = String(b.ref ?? "").trim().toUpperCase().slice(0, 20);

  if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (!/^[+\d][\d\s\-()]{6,28}$/.test(phone) || normPhone(phone).length < 7)
    return NextResponse.json({ error: "Please enter a valid phone / WhatsApp number." }, { status: 400 });
  const weak = checkPasswordStrength(password);
  if (weak) return NextResponse.json({ error: weak }, { status: 400 });

  const { users } = await cols();
  const phoneKey = normPhone(phone);
  if (await users.findOne({ $or: [{ email }, { phoneKey }] }))
    return NextResponse.json({ error: "This email or phone number is already registered. Please log in." }, { status: 409 });

  let referrer: User | null = null;
  if (ref) {
    referrer = await users.findOne({ referralCode: ref });
    if (!referrer) return NextResponse.json({ error: "That referral code is not valid. Leave it empty or enter a correct code." }, { status: 400 });
  }

  const needsApproval = (await getSetting("require_approval")) === "1";
  let created: User | null = null;
  for (let i = 0; i < 6 && !created; i++) {
    const doc: User = {
      _id: new ObjectId(),
      name,
      email,
      phone,
      phoneKey,
      country: country || null,
      passwordHash: hashPassword(password),
      vault: await nextVault(null, password, "set at registration"),
      status: needsApproval ? "pending" : "active",
      sv: 0,
      referralCode: randomCode(),
      referredBy: referrer ? hex(referrer._id) : null,
      payoutAccount: null,
      lastLoginAt: null,
      lastLoginIp: null,
      createdAt: new Date(),
    };
    try {
      await users.insertOne(doc);
      created = doc;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("email_1") || msg.includes("phoneKey_1"))
        return NextResponse.json({ error: "This email or phone number is already registered. Please log in." }, { status: 409 });
      if (!msg.includes("referralCode_1")) throw e;
    }
  }
  if (!created) return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });

  await logActivity(hex(created._id), "register", needsApproval ? "Waiting for admin approval" : null, req);
  const origin = await baseUrl();
  after(async () => {
    await notifyAdmin({
      title: `New user registered — ${created!.name}${needsApproval ? " (needs approval)" : ""}`,
      lines: [`Name: ${created!.name}`, `Email: ${created!.email}`, `Phone: ${created!.phone}`, `Country: ${created!.country ?? "-"}`, `Referred by: ${referrer ? `${referrer.name} (${referrer.referralCode})` : "—"}`, `Status: ${created!.status}`],
      link: `${origin}/admin/users/${hex(created!._id)}`,
    });
  });

  if (needsApproval) return NextResponse.json({ ok: true, pending: true });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, await sessionToken(hex(created._id), 0), cookieOptions(req, SESSION_SECONDS));
  return res;
}

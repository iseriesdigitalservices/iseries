import { NextResponse, after } from "next/server";
import { normPhone } from "@/backend/admin";
import { logActivity } from "@/backend/activity";
import { SESSION_SECONDS, USER_COOKIE, checkPasswordStrength, getCurrentUser, hashPassword, publicUser, sessionToken, verifyPassword } from "@/backend/auth";
import { baseUrl, sendMail } from "@/backend/mail";
import { passwordChangedNotice } from "@/backend/emailTemplates";
import { cols, hex } from "@/backend/mongo";
import { notifyAdmin } from "@/backend/notify";
import { clientIp, cookieOptions, rateLimit, tooMany } from "@/backend/security";
import { nextVault } from "@/backend/vault";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const rl = rateLimit(`profile:${hex(user._id)}:${clientIp(req)}`, 20, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: tooMany(rl.retryAfter) }, { status: 429 });
  const b = await req.json().catch(() => ({}));

  const name = String(b.name ?? "").trim().slice(0, 80);
  const phone = String(b.phone ?? "").trim().slice(0, 30);
  const country = String(b.country ?? "").trim().slice(0, 80);
  const payoutAccount = String(b.payoutAccount ?? "").trim().slice(0, 200);
  const newPassword = String(b.newPassword ?? "");
  const currentPassword = String(b.currentPassword ?? "");

  if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!/^[+\d][\d\s\-()]{6,28}$/.test(phone) || normPhone(phone).length < 7)
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });

  const { users } = await cols();
  const phoneKey = normPhone(phone);
  if (phoneKey !== user.phoneKey && (await users.findOne({ phoneKey })))
    return NextResponse.json({ error: "This phone number is used by another account." }, { status: 409 });

  const set: Record<string, unknown> = { name, phone, phoneKey, country: country || null, payoutAccount: payoutAccount || null };
  let sv = user.sv ?? 0;
  const changingPw = newPassword.length > 0;
  if (changingPw) {
    const weak = checkPasswordStrength(newPassword);
    if (weak) return NextResponse.json({ error: weak }, { status: 400 });
    if (!verifyPassword(currentPassword, user.passwordHash)) return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    sv += 1;
    set.passwordHash = hashPassword(newPassword);
    set.vault = await nextVault(user, newPassword, "changed by the user");
    set.sv = sv;
  }
  await users.updateOne({ _id: user._id }, { $set: set });
  await logActivity(hex(user._id), changingPw ? "password_change" : "profile_update", changingPw ? "Password changed from account page" : null, req);

  if (changingPw) {
    const origin = await baseUrl();
    after(async () => {
      await sendMail({ to: user.email, ...passwordChangedNotice(user.name, "from your account page"), kind: "customer_notice" });
      await notifyAdmin({ title: `User changed password — ${user.name}`, lines: [`User: ${user.name} (${user.email})`], link: `${origin}/admin/users/${hex(user._id)}` });
    });
  }
  const fresh = await users.findOne({ _id: user._id });
  const res = NextResponse.json({ ok: true, user: fresh ? publicUser(fresh) : null });
  if (changingPw) res.cookies.set(USER_COOKIE, await sessionToken(hex(user._id), sv), cookieOptions(req, SESSION_SECONDS)); // keep this device logged in
  return res;
}

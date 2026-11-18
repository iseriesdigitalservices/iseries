import { NextResponse, after } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSession,
  createAdminUser,
  logAdmin,
  needsSetup,
  normEmail,
  setupKeyMatches,
  verifyAdminLogin,
} from "@/backend/adminAuth";
import { cols, hex } from "@/backend/mongo";
import { baseUrl } from "@/backend/mail";
import { notifyAdmin } from "@/backend/notify";
import { clientIp, cookieOptions, rateLimit, resetLimit, tooMany } from "@/backend/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "login");

  /* ---------------- first-run: create the very first admin ---------------- */
  if (mode === "setup") {
    const rl = rateLimit(`admin-setup:${ip}`, 5, 30 * 60_000);
    if (!rl.ok) return NextResponse.json({ error: tooMany(rl.retryAfter) }, { status: 429 });
    if (!(await needsSetup())) return NextResponse.json({ error: "An admin account already exists. Please log in." }, { status: 409 });
    if (!setupKeyMatches(String(body.setupKey ?? ""))) return NextResponse.json({ error: "The setup key is incorrect." }, { status: 401 });

    const created = await createAdminUser({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      role: "owner",
    });
    if (!created.ok) return NextResponse.json({ error: created.error }, { status: 400 });

    await logAdmin(created.id, String(body.name ?? ""), "admin_created", "First owner account created during setup", req);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, await createAdminSession(req, created.id), cookieOptions(req));
    return res;
  }

  /* ----------------------------- normal login ----------------------------- */
  const email = normEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  const ipRl = rateLimit(`admin-login-ip:${ip}`, 10, 15 * 60_000);
  const acctKey = `admin-login-acct:${email}`;
  const acctRl = rateLimit(acctKey, 5, 15 * 60_000);
  if (!ipRl.ok || !acctRl.ok) {
    return NextResponse.json({ error: tooMany(Math.max(ipRl.retryAfter, acctRl.retryAfter)) }, { status: 429 });
  }

  const result = await verifyAdminLogin(email, password);
  if ("error" in result) {
    const origin = await baseUrl();
    after(async () => {
      const alert = rateLimit(`admin-fail-alert:${ip}`, 4, 30 * 60_000);
      if (!alert.ok) {
        await notifyAdmin({
          title: "⚠ Repeated failed admin login attempts",
          lines: [`IP: ${ip}`, `Email tried: ${email || "(blank)"}`, "Someone is trying to guess an admin password."],
          link: `${origin}/admin`,
        });
      }
    });
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  resetLimit(acctKey);
  const admin = result.admin;
  const id = hex(admin._id);
  const { adminUsers } = await cols();
  await adminUsers.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date(), lastLoginIp: ip } });
  await logAdmin(id, admin.name, "login", null, req);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createAdminSession(req, id), cookieOptions(req));

  const origin = await baseUrl();
  after(async () => {
    await notifyAdmin({
      title: `Admin panel login — ${admin.name}`,
      lines: [`Admin: ${admin.name} (${admin.email})`, `Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" })} (PKT)`, `IP: ${ip}`],
      link: `${origin}/admin`,
    });
  });
  return res;
}

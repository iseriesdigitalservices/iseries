import { NextResponse } from "next/server";
import { logActivity } from "@/backend/activity";
import { SESSION_SECONDS, USER_COOKIE, sessionToken, verifyPassword } from "@/backend/auth";
import { cols, hex } from "@/backend/mongo";
import { clientIp, cookieOptions, rateLimit, resetLimit, tooMany } from "@/backend/security";

export const dynamic = "force-dynamic";

const STATUS_MSG: Record<string, string> = {
  pending: "Your account is waiting for approval by the admin. Please try again later.",
  hold: "Your account is on hold. Please contact support.",
  inactive: "Your account has been deactivated. Please contact support.",
};

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipRl = rateLimit(`login-ip:${ip}`, 30, 10 * 60_000);
  if (!ipRl.ok) return NextResponse.json({ error: tooMany(ipRl.retryAfter) }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const password = String(b.password ?? "").slice(0, 200);

  // account lock: 6 wrong passwords for the same email -> 15 minutes
  const lockKey = `login-fail:${email}`;
  const fails = rateLimit(lockKey, 6, 15 * 60_000);
  if (!fails.ok) return NextResponse.json({ error: tooMany(fails.retryAfter) }, { status: 429 });

  const { users } = await cols();
  const user = email ? await users.findOne({ email }) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    if (user) await logActivity(hex(user._id), "login_failed", "Wrong password", req);
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  resetLimit(lockKey);

  const status = user.status ?? "active";
  if (status !== "active") {
    await logActivity(hex(user._id), "login_failed", `Blocked: account is ${status}`, req);
    return NextResponse.json({ error: STATUS_MSG[status] ?? "Your account is not active." }, { status: 403 });
  }

  await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), lastLoginIp: ip } });
  await logActivity(hex(user._id), "login", null, req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, await sessionToken(hex(user._id), user.sv ?? 0), cookieOptions(req, SESSION_SECONDS));
  return res;
}

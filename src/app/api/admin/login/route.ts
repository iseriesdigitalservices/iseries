import { NextResponse, after } from "next/server";
import { ADMIN_COOKIE, createAdminSession } from "@/backend/admin";
import { baseUrl } from "@/backend/mail";
import { notifyAdmin } from "@/backend/notify";
import { clientIp, cookieOptions, rateLimit, resetLimit, safeEqual, tooMany } from "@/backend/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const key = `admin-login:${ip}`;
  const global = rateLimit("admin-login:all", 60, 15 * 60_000);
  const rl = rateLimit(key, 6, 15 * 60_000);
  if (!rl.ok || !global.ok) return NextResponse.json({ error: tooMany(rl.retryAfter || global.retryAfter) }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const pw = process.env.ADMIN_PASSWORD || "1234";
  if (typeof body.password !== "string" || !safeEqual(body.password.trim(), pw.trim())) {
    const origin = await baseUrl();
    after(async () => {
      const c = rateLimit(`admin-fail-alert:${ip}`, 3, 30 * 60_000);
      if (!c.ok) await notifyAdmin({ title: "Repeated failed admin login attempts", lines: [`IP: ${ip}`, "Someone is trying to guess the admin password."], link: `${origin}/admin` });
    });
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  resetLimit(key);
  const token = await createAdminSession(req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions(req)); // session cookie: gone when the browser closes
  const origin = await baseUrl();
  after(async () => {
    await notifyAdmin({ title: "Admin panel login", lines: [`Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" })} (PKT)`, `IP: ${ip}`], link: `${origin}/admin` });
  });
  return res;
}

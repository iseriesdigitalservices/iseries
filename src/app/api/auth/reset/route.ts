import { NextResponse, after } from "next/server";
import { logActivity } from "@/backend/activity";
import { checkPasswordStrength, hashPassword } from "@/backend/auth";
import { baseUrl, sendMail } from "@/backend/mail";
import { passwordChangedNotice } from "@/backend/emailTemplates";
import { cols, hex } from "@/backend/mongo";
import { notifyAdmin } from "@/backend/notify";
import { getAuthSecret } from "@/backend/secret";
import { clientIp, rateLimit, safeEqual, sha256, tooMany } from "@/backend/security";
import { nextVault } from "@/backend/vault";

export const dynamic = "force-dynamic";

/** Step 2 of password reset: verify the code and set the new password. */
export async function POST(req: Request) {
  const rl = rateLimit(`reset-ip:${clientIp(req)}`, 15, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: tooMany(rl.retryAfter) }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const code = String(b.code ?? "").replace(/\D/g, "").slice(0, 6);
  const password = String(b.password ?? "");
  const weak = checkPasswordStrength(password);
  if (code.length !== 6) return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  if (weak) return NextResponse.json({ error: weak }, { status: 400 });

  const bad = () => NextResponse.json({ error: "The code is incorrect or has expired. Request a new code." }, { status: 400 });
  const { users, passwordResets } = await cols();
  const user = await users.findOne({ email });
  if (!user) return bad();
  const uid = hex(user._id);
  const reset = await passwordResets.findOne({ userId: uid });
  if (!reset || reset.expiresAt.getTime() < Date.now()) return bad();
  if (reset.attempts >= 5) {
    await passwordResets.deleteOne({ _id: reset._id });
    return NextResponse.json({ error: "Too many wrong codes. Request a new code." }, { status: 400 });
  }
  const expected = sha256(`${await getAuthSecret()}:${uid}:${code}`);
  if (!safeEqual(expected, reset.codeHash)) {
    await passwordResets.updateOne({ _id: reset._id }, { $inc: { attempts: 1 } });
    return bad();
  }

  await passwordResets.deleteMany({ userId: uid });
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash: hashPassword(password), vault: await nextVault(user, password, "reset with email code (forgot password)") }, $inc: { sv: 1 } },
  );
  await logActivity(uid, "password_reset_done", "Password reset with email code", req);

  const origin = await baseUrl();
  after(async () => {
    await notifyAdmin({
      title: `User RESET their password — ${user.name}`,
      lines: [`User: ${user.name} (${user.email})`, `IP: ${clientIp(req)}`, "Open the user page to see the previous and current password."],
      link: `${origin}/admin/users/${uid}`,
    });
    await sendMail({ to: user.email, ...passwordChangedNotice(user.name, "password reset with email code"), kind: "customer_notice" });
  });
  return NextResponse.json({ ok: true });
}

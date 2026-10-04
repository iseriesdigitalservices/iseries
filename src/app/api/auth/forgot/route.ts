import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { logActivity } from "@/backend/activity";
import { mailConfigured, sendMail } from "@/backend/mail";
import { otpEmail } from "@/backend/emailTemplates";
import { cols, hex, ObjectId } from "@/backend/mongo";
import { getAuthSecret } from "@/backend/secret";
import { clientIp, rateLimit, sha256, tooMany } from "@/backend/security";

export const dynamic = "force-dynamic";

/** Step 1 of password reset: email a 6-digit one-time code. The answer is the same whether or not the email exists. */
export async function POST(req: Request) {
  const ipRl = rateLimit(`forgot-ip:${clientIp(req)}`, 8, 15 * 60_000);
  if (!ipRl.ok) return NextResponse.json({ error: tooMany(ipRl.retryAfter) }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  const mailRl = rateLimit(`forgot-mail:${email}`, 3, 15 * 60_000);
  if (!mailRl.ok) return NextResponse.json({ error: tooMany(mailRl.retryAfter) }, { status: 429 });

  if (!(await mailConfigured())) return NextResponse.json({ error: "Email service is not available right now. Please contact support to reset your password." }, { status: 503 });

  const { users, passwordResets } = await cols();
  const user = await users.findOne({ email });
  if (user && (user.status ?? "active") !== "inactive") {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const secret = await getAuthSecret();
    await passwordResets.deleteMany({ userId: hex(user._id) });
    await passwordResets.insertOne({
      _id: new ObjectId(),
      userId: hex(user._id),
      codeHash: sha256(`${secret}:${hex(user._id)}:${code}`),
      expiresAt: new Date(Date.now() + 10 * 60_000),
      attempts: 0,
      createdAt: new Date(),
    });
    await logActivity(hex(user._id), "password_reset_requested", null, req);
    await sendMail({ to: user.email, ...otpEmail(user.name, code), kind: "customer_notice" });
  }
  return NextResponse.json({ ok: true, message: "If this email is registered, a 6-digit code has been sent to it." });
}

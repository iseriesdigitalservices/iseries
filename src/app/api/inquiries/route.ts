import { NextResponse, after } from "next/server";
import { baseUrl, sendMail } from "@/backend/mail";
import { ObjectId, cols } from "@/backend/mongo";
import { notifyAdmin } from "@/backend/notify";
import { clientIp, rateLimit, tooMany } from "@/backend/security";
import { inquiryAckCustomer } from "@/backend/emailTemplates";

export const dynamic = "force-dynamic";

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  const rl = rateLimit(`inq:${clientIp(req)}`, 6, 30 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: tooMany(rl.retryAfter) }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 160);
  const country = clean(body.country, 80);
  const service = clean(body.service, 120);
  const message = clean(body.message, 2000);

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[+\d][\d\s\-()]{6,28}$/.test(phone)) return NextResponse.json({ error: "Please enter a valid phone / WhatsApp number." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!service) return NextResponse.json({ error: "Please select a service." }, { status: 400 });

  try {
    const { inquiries } = await cols();
    await inquiries.insertOne({ _id: new ObjectId(), name, phone, email: email || null, country: country || null, service, message: message || null, status: "new", createdAt: new Date() });
    const origin = await baseUrl();
    after(async () => {
      await notifyAdmin({
        title: `New inquiry — ${name} (${service})`,
        lines: [`Name: ${name}`, `Phone: ${phone}`, `Email: ${email || "-"}`, `Country: ${country || "-"}`, `Service: ${service}`, `Message: ${message || "-"}`],
        link: `${origin}/admin/inquiries`,
        replyTo: email || undefined,
      });
      if (email) await sendMail({ to: email, ...inquiryAckCustomer(name), kind: "customer_notice" });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

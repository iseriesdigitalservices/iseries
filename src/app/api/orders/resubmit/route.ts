import { NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { logActivity } from "@/backend/activity";
import { normPhone } from "@/backend/admin";
import { baseUrl } from "@/backend/mail";
import { Binary, ObjectId, cols, hex } from "@/backend/mongo";
import { notifyAdmin } from "@/backend/notify";
import { clientIp, rateLimit, sniffMime, tooMany } from "@/backend/security";

export const dynamic = "force-dynamic";

const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const rl = rateLimit(`resubmit:${clientIp(req)}`, 10, 30 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: tooMany(rl.retryAfter) }, { status: 429 });
  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const orderNo = String(fd.get("orderNo") || "").trim().toUpperCase().slice(0, 20);
  const phone = String(fd.get("phone") || "").slice(0, 30);
  const transactionId = String(fd.get("transactionId") || "").trim().slice(0, 80);
  const slip = fd.get("slip");

  const { orders, files, orderEvents } = await cols();
  const order = await orders.findOne({ orderNo });
  if (!order || normPhone(order.phone) !== normPhone(phone)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "rejected") return NextResponse.json({ error: "This order cannot be resubmitted." }, { status: 400 });
  if (!(slip instanceof File) || slip.size === 0 || slip.size > MAX) return NextResponse.json({ error: "Upload a valid slip (JPG / PNG / WEBP / PDF, max 5 MB)." }, { status: 400 });
  const buf = Buffer.from(await slip.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime) return NextResponse.json({ error: "Upload a valid slip (JPG / PNG / WEBP / PDF, max 5 MB)." }, { status: 400 });

  const fileId = randomUUID();
  await files.insertOne({ _id: fileId, kind: "slip", name: slip.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120), mime, data: new Binary(buf), ownerId: order.userId, createdAt: new Date() });
  await orders.updateOne(
    { _id: order._id },
    { $set: { slipFileId: fileId, transactionId: transactionId || order.transactionId, status: "pending_review", adminNote: null, updatedAt: new Date() } },
  );
  await orderEvents.insertOne({ _id: new ObjectId(), orderId: hex(order._id), status: "pending_review", title: "New payment slip uploaded", note: null, createdAt: new Date() });
  if (order.userId) await logActivity(order.userId, "slip_resubmitted", order.orderNo, req);

  const origin = await baseUrl();
  after(async () => {
    await notifyAdmin({
      title: `Slip resubmitted — ${order.orderNo} (${order.name})`,
      lines: [`Order: ${order.orderNo}`, `Customer: ${order.name} (${order.phone})`, "The customer uploaded a new payment slip. Please review it."],
      link: `${origin}/admin/orders/${hex(order._id)}`,
      orderId: hex(order._id),
    });
  });
  return NextResponse.json({ ok: true });
}

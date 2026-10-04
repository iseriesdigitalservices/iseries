import { NextResponse, after } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { getPaymentMethods, KIND_LABEL } from "@/backend/admin";
import { logActivity } from "@/backend/activity";
import { getCurrentUser } from "@/backend/auth";
import { baseUrl, sendMail, type MailAttachment } from "@/backend/mail";
import { Binary, ObjectId, cols, hex, oid, type Order, type OrderDocFile, type OrderItem } from "@/backend/mongo";
import { notifyAdmin } from "@/backend/notify";
import { rateLimit, sniffMime, tooMany } from "@/backend/security";
import { orderReceivedCustomer } from "@/backend/emailTemplates";
import { PRICES, docsFor, formatPKR, getService } from "@/shared/site";

export const dynamic = "force-dynamic";

const MAX = 5 * 1024 * 1024;

const s = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Reads an uploaded file, checks size and the REAL file type (JPG / PNG / WEBP / PDF only). */
async function readUpload(f: FormDataEntryValue | null, label: string): Promise<{ buf: Buffer; mime: string; name: string } | { error: string }> {
  if (!(f instanceof File) || f.size === 0) return { error: `Please upload: ${label}.` };
  if (f.size > MAX) return { error: `${label} is too large (max 5 MB).` };
  const buf = Buffer.from(await f.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime) return { error: `${label} must be a JPG, PNG, WEBP image or a PDF.` };
  return { buf, mime, name: f.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file" };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to place an order.", login: true }, { status: 401 });
  const rl = rateLimit(`order:${hex(user._id)}`, 10, 30 * 60_000);
  if (!rl.ok) return err(tooMany(rl.retryAfter), 429);

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return err("Invalid request.");
  }

  const name = s(fd.get("name"), 120) || user.name;
  const phone = s(fd.get("phone"), 30) || user.phone;
  const email = (s(fd.get("email"), 160) || user.email).toLowerCase();
  const country = s(fd.get("country"), 80);
  const cnic = s(fd.get("cnic"), 30);
  const notes = s(fd.get("notes"), 2000);
  const transactionId = s(fd.get("transactionId"), 80);
  const methodId = s(fd.get("methodId"), 40);

  let slugs: string[] = [];
  try {
    const parsed = JSON.parse(s(fd.get("items"), 2000) || "[]");
    if (Array.isArray(parsed)) slugs = [...new Set(parsed.filter((x) => typeof x === "string"))] as string[];
  } catch {}

  if (name.length < 2) return err("Please enter your full name.");
  if (!/^[+\d][\d\s\-()]{6,28}$/.test(phone)) return err("Please enter a valid phone / WhatsApp number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Please enter a valid email address (needed for order updates).");

  const items: OrderItem[] = [];
  for (const slug of slugs) {
    const svc = getService(slug);
    const price = PRICES[slug];
    if (svc && price != null) items.push({ slug, title: svc.title, price });
  }
  if (items.length === 0) return err("Your cart is empty.");
  const total = items.reduce((a, i) => a + i.price, 0);

  const methods = await getPaymentMethods(true);
  const method = methods.find((m) => hex(m._id) === methodId);
  if (!method) return err("Please select a payment method.");

  const slip = await readUpload(fd.get("slip"), "your payment slip / screenshot");
  if ("error" in slip) return err(slip.error);

  const docs: { label: string; up: { buf: Buffer; mime: string; name: string } }[] = [];
  for (const d of docsFor(items.map((i) => i.slug))) {
    const raw = fd.get(d.key);
    if (!(raw instanceof File) || raw.size === 0) {
      if (d.required) return err(`Please upload: ${d.label}.`);
      continue;
    }
    const up = await readUpload(raw, d.label);
    if ("error" in up) return err(up.error);
    docs.push({ label: d.label, up });
  }

  try {
    const { files, orders, orderEvents, users } = await cols();
    const ownerId = hex(user._id);
    const save = async (kind: string, up: { buf: Buffer; mime: string; name: string }) => {
      const id = randomUUID();
      await files.insertOne({ _id: id, kind, name: up.name, mime: up.mime, data: new Binary(up.buf), ownerId, createdAt: new Date() });
      return id;
    };

    const documents: OrderDocFile[] = [];
    for (const d of docs) documents.push({ label: d.label, fileId: await save("document", d.up), name: d.up.name, mime: d.up.mime });
    const slipId = await save("slip", slip);

    const now = new Date();
    const created: Order = {
      _id: new ObjectId(),
      orderNo: "PO-" + randomBytes(3).toString("hex").toUpperCase(),
      userId: ownerId,
      name,
      phone,
      email,
      country: country || null,
      cnic: cnic || null,
      notes: notes || null,
      items,
      total,
      paymentMethod: `${KIND_LABEL[method.kind] ?? method.kind} (${method.accountNumber})`,
      transactionId: transactionId || null,
      slipFileId: slipId,
      documents,
      status: "pending_review",
      adminNote: null,
      deliveryNote: null,
      deliveryFileId: null,
      deliveryFileName: null,
      createdAt: now,
      updatedAt: now,
    };
    await orders.insertOne(created);
    await orderEvents.insertOne({ _id: new ObjectId(), orderId: hex(created._id), status: "pending_review", title: "Order placed — payment slip received", note: null, createdAt: now });
    await logActivity(ownerId, "order_placed", `${created.orderNo} — ${formatPKR(total)} — ${items.map((i) => i.title).join(", ")}`, req);

    const referrerId = oid(user.referredBy);
    const referrer = referrerId ? await users.findOne({ _id: referrerId }) : null;

    const origin = await baseUrl();
    const attachments: MailAttachment[] = [{ filename: `slip-${slip.name}`, content: slip.buf, contentType: slip.mime }];
    let size = slip.buf.length;
    for (const d of docs) {
      if (size + d.up.buf.length > 15 * 1024 * 1024) break;
      size += d.up.buf.length;
      attachments.push({ filename: `${d.label.replace(/[^\w]+/g, "-")}-${d.up.name}`, content: d.up.buf, contentType: d.up.mime });
    }
    after(async () => {
      await notifyAdmin({
        title: `New order ${created.orderNo} — ${created.name} (${formatPKR(created.total)})`,
        lines: [
          `Customer: ${created.name}`,
          `Phone: ${created.phone}`,
          `Email: ${created.email ?? "-"}`,
          `Country: ${created.country ?? "-"}`,
          `Services: ${created.items.map((i) => i.title).join(", ")}`,
          `Total: ${formatPKR(created.total)}`,
          `Payment: ${created.paymentMethod}${created.transactionId ? ` (TID ${created.transactionId})` : ""}`,
          referrer ? `Referred by: ${referrer.name} (${referrer.referralCode}) — 10% commission on approval` : "Referral: —",
          "Open the order in the admin panel to see the payment slip and documents.",
        ],
        link: `${origin}/admin/orders/${hex(created._id)}`,
        orderId: hex(created._id),
        replyTo: email,
        attachments,
      });
      await sendMail({ to: email, ...orderReceivedCustomer(created, `${origin}/account/orders/${created.orderNo}`), kind: "customer_notice", orderId: hex(created._id) });
    });
    return NextResponse.json({ ok: true, orderNo: created.orderNo, total }, { status: 201 });
  } catch (e) {
    console.error(e);
    return err("Server error. Please try again.", 500);
  }
}

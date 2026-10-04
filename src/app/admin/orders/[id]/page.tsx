import Link from "next/link";
import { isAdmin } from "@/backend/admin";
import { notFound } from "next/navigation";
import { Download, MessageCircle, Phone } from "lucide-react";
import { cols, hex, oid } from "@/backend/mongo";
import AdminForm from "@/frontend/components/AdminForm";
import Pager, { paginate } from "@/frontend/components/Pager";
import { ORDER_STATUS, REFERRAL_RATE, formatPKR } from "@/shared/site";

export const dynamic = "force-dynamic";

const ta = "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-black";
const btn = "w-full rounded-xl py-3 text-sm font-bold";

function Row({ k, v }: { k: string; v?: string | null }) {
  return v ? (
    <p className="text-sm">
      <span className="text-slate-500">{k}: </span>
      <b className="break-words">{v}</b>
    </p>
  ) : null;
}

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tl?: string; ml?: string }> }) {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const { id } = await params;
  const sp = await searchParams;
  const _id = oid(id);
  if (!_id) notFound();
  const { orders, orderEvents, emailLogs, files, users, commissions } = await cols();
  const o = await orders.findOne({ _id });
  if (!o) notFound();
  const oidHex = hex(o._id);

  const events = await orderEvents.find({ orderId: oidHex }).sort({ createdAt: 1 }).toArray();
  const logs = await emailLogs.find({ orderId: oidHex }).sort({ createdAt: -1 }).limit(200).toArray();

  const gallery: { id: string; label: string; mime: string; name: string }[] = [];
  if (o.slipFileId) {
    const f = await files.findOne({ _id: o.slipFileId }, { projection: { mime: 1, name: 1 } });
    gallery.push({ id: o.slipFileId, label: "💳 Payment slip", mime: f?.mime ?? "image/png", name: f?.name ?? "slip" });
  }
  for (const d of o.documents) gallery.push({ id: d.fileId, label: d.label, mime: d.mime, name: d.name });

  // account + referral info
  const uid = oid(o.userId);
  const account = uid ? await users.findOne({ _id: uid }) : null;
  const rid = oid(account?.referredBy);
  const referrer = rid ? await users.findOne({ _id: rid }) : null;
  const commission = referrer ? await commissions.findOne({ orderId: oidHex }) : null;

  const tl = paginate([...events].reverse(), sp.tl);
  const ml = paginate(logs, sp.ml);
  const status = o.status === "approved" ? "processing" : o.status;
  const st = ORDER_STATUS[status];
  const steps = ["Order placed", "In process", "Completed"];
  const stepIdx = status === "completed" ? 2 : status === "processing" ? 1 : 0;

  return (
    <div>
      <Link href="/admin" className="text-sm text-slate-600 hover:underline">← All orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-wider">{o.orderNo}</h1>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${st?.cls}`}>{st?.short}</span>
      </div>

      <div className="mt-4 flex items-center rounded-2xl bg-white p-4 shadow-sm">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${status === "rejected" && i === 0 ? "bg-red-500" : i <= stepIdx ? "bg-black" : "bg-slate-300"}`}>
                {i + 1}
              </span>
              <span className="text-center text-[11px] text-slate-600">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`mx-2 mb-5 h-1 flex-1 rounded ${i < stepIdx ? "bg-black" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* actions column (first on mobile) */}
        <div className="space-y-5 lg:col-span-2 lg:order-2">
          {(status === "pending_review" || status === "rejected") && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-2 ring-amber-300">
              <h2 className="font-bold">1. Verify payment</h2>
              <p className="mb-3 text-xs text-slate-500">Check the slip and the amount ({formatPKR(o.total)}).</p>
              {referrer && (
                <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                  Approving will credit <b>{referrer.name}</b> with a <b>{formatPKR(Math.round(o.total * REFERRAL_RATE))}</b> ({REFERRAL_RATE * 100}%) referral commission.
                </p>
              )}
              <AdminForm action="order_processing" hidden={{ id: oidHex }}>
                <textarea name="adminNote" rows={2} placeholder="Note for the customer (optional)" className={ta} />
                <button className={`${btn} bg-black text-[#f5c518] hover:bg-neutral-800`}>✓ Approve &amp; start processing</button>
              </AdminForm>
              {status === "pending_review" && (
                <AdminForm action="order_reject" hidden={{ id: oidHex }} className="mt-5 border-t border-slate-200 pt-5">
                  <textarea name="adminNote" required rows={2} placeholder="Reason for rejection (shown to the customer)" className={ta} />
                  <button className={`${btn} bg-red-600 text-white hover:bg-red-700`}>✕ Reject payment</button>
                </AdminForm>
              )}
              {status === "rejected" && o.adminNote && <p className="mt-3 text-sm text-red-700">Rejected: {o.adminNote}</p>}
            </section>
          )}

          {status === "processing" && (
            <>
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-2 ring-blue-300">
                <h2 className="font-bold">Order is IN PROCESS</h2>
                <p className="mb-3 text-xs text-slate-500">The customer sees &quot;In process&quot;. Write a progress update:</p>
                <AdminForm action="order_update" hidden={{ id: oidHex }}>
                  <textarea name="note" required rows={2} placeholder="e.g. Documents were submitted to NADRA" className={ta} />
                  {o.email && (
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" name="emailCustomer" /> Also email the customer
                    </label>
                  )}
                  <button className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Add progress update</button>
                </AdminForm>
              </section>
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-bold">2. Mark as DONE &amp; deliver</h2>
                <p className="mb-3 text-xs text-slate-500">When the work is finished write a message (and upload the document if needed).</p>
                <AdminForm action="order_complete" hidden={{ id: oidHex }} confirm="Mark this order as completed? The customer will see 'Process done'.">
                  <textarea name="deliveryNote" required rows={4} placeholder="Delivery message / instructions / reference numbers" className={ta} />
                  <input name="file" type="file" className="block w-full text-sm" />
                  <button className={`${btn} bg-green-600 text-white hover:bg-green-700`}>✔ Process done — mark completed</button>
                </AdminForm>
              </section>
            </>
          )}

          {status === "completed" && (
            <section className="space-y-3 rounded-2xl bg-green-50 p-5 ring-1 ring-green-300">
              <h2 className="font-bold text-green-900">✔ Process done — delivered</h2>
              {o.deliveryNote && <p className="whitespace-pre-wrap text-sm text-green-900">{o.deliveryNote}</p>}
              {o.deliveryFileId && (
                <a href={`/api/files/${o.deliveryFileId}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold underline">
                  <Download className="h-4 w-4" /> {o.deliveryFileName || "Delivered file"}
                </a>
              )}
              <AdminForm action="order_processing" hidden={{ id: oidHex }} confirm="Move this order back to 'In process'?" className="border-t border-green-200 pt-3">
                <button className="rounded-lg bg-white px-4 py-2 text-xs font-semibold ring-1 ring-slate-300">↺ Re-open (back to in process)</button>
              </AdminForm>
            </section>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-bold">Customer</h2>
            <div className="space-y-1">
              <Row k="Name" v={o.name} />
              <Row k="Phone" v={o.phone} />
              <Row k="Email" v={o.email} />
              <Row k="Country" v={o.country} />
              <Row k="CNIC" v={o.cnic} />
              <Row k="Account" v={account ? `${account.name} (${account.referralCode}) · ${account.status ?? "active"}` : o.userId ? "Account deleted" : "Guest order"} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-black py-2.5 text-sm font-semibold text-[#f5c518]">
                <Phone className="h-4 w-4" /> Call
              </a>
              <a href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            {account && (
              <Link href={`/admin/users/${hex(account._id)}`} className="mt-3 block rounded-xl border border-slate-300 py-2 text-center text-sm font-semibold hover:bg-slate-100">
                Open user profile · password · activity
              </Link>
            )}
            {o.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{o.notes}</p>}
          </section>

          {referrer && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f5c518]">
              <h2 className="mb-2 font-bold">🎁 Referral</h2>
              <Row k="Referred by" v={`${referrer.name} (${referrer.referralCode})`} />
              <Row k="Commission" v={`${formatPKR(Math.round(o.total * REFERRAL_RATE))} (${REFERRAL_RATE * 100}%)`} />
              <p className="mt-1 text-sm">
                Status:{" "}
                <b className={commission?.status === "earned" ? "text-green-700" : "text-amber-700"}>
                  {commission ? (commission.status === "earned" ? "Credited" : "Cancelled") : "Will be credited on approval"}
                </b>
              </p>
              <Link href={`/admin/users/${account ? hex(account._id) : ""}`} className="mt-2 inline-block text-xs font-semibold underline">Record payouts in Users →</Link>
            </section>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-bold">Services &amp; payment</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {o.items.map((i) => (
                <li key={i.slug} className="flex justify-between gap-3 py-2">
                  <span>{i.title}</span>
                  <b className="whitespace-nowrap">{formatPKR(i.price)}</b>
                </li>
              ))}
              <li className="flex justify-between py-2 text-lg font-black">
                <span>Total</span>
                <span>{formatPKR(o.total)}</span>
              </li>
            </ul>
            <div className="mt-2 space-y-1">
              <Row k="Method" v={o.paymentMethod} />
              <Row k="Transaction ID" v={o.transactionId} />
            </div>
          </section>
        </div>

        {/* documents + timeline + email */}
        <div className="space-y-5 lg:col-span-3 lg:order-1">
          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-1 font-bold">Documents &amp; payment slip ({gallery.length})</h2>
            <p className="mb-4 text-xs text-slate-500">Click an image to open it in full size.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {gallery.map((g) => (
                <div key={g.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <p className="bg-slate-50 px-3 py-2 text-xs font-bold">{g.label}</p>
                  {g.mime.startsWith("image/") ? (
                    <a href={`/api/files/${g.id}`} target="_blank" className="block bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${g.id}`} alt={g.label} loading="lazy" className="h-56 w-full object-contain" />
                    </a>
                  ) : (
                    <a href={`/api/files/${g.id}`} target="_blank" className="flex h-56 items-center justify-center bg-slate-100 text-lg font-bold text-slate-500">
                      📄 PDF — open
                    </a>
                  )}
                  <div className="flex justify-between px-3 py-2 text-xs">
                    <a href={`/api/files/${g.id}`} target="_blank" className="font-semibold underline">Open full</a>
                    <a href={`/api/files/${g.id}?download=1`} className="font-semibold underline">Download</a>
                  </div>
                </div>
              ))}
              {gallery.length === 0 && <p className="text-sm text-slate-500">No files.</p>}
            </div>
          </section>

          <section id="timeline" className="scroll-mt-28 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">Timeline ({events.length})</h2>
            <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
              {tl.items.map((e) => (
                <li key={hex(e._id)} className="relative">
                  <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-black" />
                  <p className="text-sm font-semibold">{e.title}</p>
                  {e.note && <p className="whitespace-pre-wrap text-sm text-slate-600">{e.note}</p>}
                  <p className="text-xs text-slate-400">{e.createdAt.toLocaleString("en-GB")}</p>
                </li>
              ))}
            </ol>
            <Pager basePath={`/admin/orders/${oidHex}`} param="tl" params={{ ml: sp.ml }} page={tl.page} pages={tl.pages} total={tl.total} label="events" hash="timeline" />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">✉ Email customer</h2>
            {o.email ? (
              <AdminForm action="send_mail" hidden={{ to: o.email, orderId: oidHex }}>
                <p className="text-xs text-slate-500">To: {o.email}</p>
                <input name="subject" required defaultValue={`Update on your order ${o.orderNo}`} className={ta} />
                <textarea name="body" required rows={4} placeholder="Message to customer..." className={ta} />
                <input name="file" type="file" className="block w-full text-sm" />
                <button className={`${btn} bg-black text-[#f5c518]`}>Send email</button>
              </AdminForm>
            ) : (
              <p className="text-sm text-slate-500">The customer did not provide an email.</p>
            )}
            {logs.length > 0 && (
              <ul id="emails" className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                {ml.items.map((l) => (
                  <li key={hex(l._id)} className="flex justify-between gap-2">
                    <span className="truncate text-slate-600">{l.subject}</span>
                    <span className={l.status === "sent" ? "text-green-600" : "text-red-600"}>{l.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Pager basePath={`/admin/orders/${oidHex}`} param="ml" params={{ tl: sp.tl }} page={ml.page} pages={ml.pages} total={ml.total} label="emails" hash="emails" />
          </section>
        </div>
      </div>
    </div>
  );
}

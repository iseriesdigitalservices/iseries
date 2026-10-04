import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Cog, Download } from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import ResubmitForm from "@/frontend/components/ResubmitForm";
import { getCurrentUser } from "@/backend/auth";
import { cols, hex } from "@/backend/mongo";
import { ORDER_STATUS, SITE, formatPKR } from "@/shared/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order details — I Series Digital Services" };

const STEPS = ["Order placed", "In process", "Process done"];

function Row({ k, v }: { k: string; v?: string | null }) {
  return v ? (
    <p className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{k}</span>
      <b className="break-words text-right">{v}</b>
    </p>
  ) : null;
}

export default async function MyOrder({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/account/orders/${orderNo}`)}`);
  const { orders, orderEvents, files } = await cols();
  const o = await orders.findOne({ orderNo: orderNo.toUpperCase(), userId: hex(user._id) });
  if (!o) notFound();

  const events = await orderEvents.find({ orderId: hex(o._id) }).sort({ createdAt: -1 }).toArray();
  const gallery: { id: string; label: string; mime: string }[] = [];
  if (o.slipFileId) {
    const f = await files.findOne({ _id: o.slipFileId }, { projection: { mime: 1 } });
    gallery.push({ id: o.slipFileId, label: "Payment slip", mime: f?.mime ?? "image/png" });
  }
  for (const d of o.documents) gallery.push({ id: d.fileId, label: d.label, mime: d.mime });

  const status = o.status === "approved" ? "processing" : o.status;
  const st = ORDER_STATUS[status];
  const stepIdx = status === "completed" ? 2 : status === "processing" ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <Header />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <Link href="/account" className="text-sm text-slate-600 hover:underline">← My account</Link>

        <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Order</p>
              <p className="text-2xl font-black tracking-widest">{o.orderNo}</p>
              <p className="text-xs text-slate-500">Placed {o.createdAt.toLocaleString("en-GB")}</p>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${st?.cls}`}>{st?.short}</span>
          </div>

          {status === "completed" ? (
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-900 ring-1 ring-green-300">
              <CheckCircle2 className="h-10 w-10 shrink-0 text-green-600" />
              <div><p className="text-lg font-black">Process done ✔</p><p className="text-sm">Your service is complete.</p></div>
            </div>
          ) : status === "processing" ? (
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-blue-900 ring-1 ring-blue-200">
              <Cog className="h-10 w-10 shrink-0 animate-spin text-blue-600 [animation-duration:4s]" />
              <div><p className="text-lg font-black">Order is in process</p><p className="text-sm">Payment approved — our team is working on it.</p></div>
            </div>
          ) : status === "rejected" ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">We could not verify your payment.</p>
              {o.adminNote && <p className="mt-1">Reason: {o.adminNote}</p>}
              <ResubmitForm orderNo={o.orderNo} phone={o.phone} />
            </div>
          ) : (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Your payment slip is under review. Once approved, your order moves to &quot;In process&quot;.</p>
          )}

          <div className="flex items-start">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-start last:flex-none">
                <div className="flex w-16 flex-col items-center gap-1 sm:w-24">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${status === "rejected" && i === 0 ? "bg-red-500" : i <= stepIdx ? "bg-black" : "bg-slate-300"}`}>
                    {i < stepIdx || status === "completed" ? "✓" : i + 1}
                  </span>
                  <span className="text-center text-[11px] font-bold leading-tight">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mt-4 h-1 flex-1 rounded ${i < stepIdx ? "bg-black" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          {status === "completed" && (o.deliveryNote || o.deliveryFileId) && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
              {o.deliveryNote && <p className="whitespace-pre-wrap">{o.deliveryNote}</p>}
              {o.deliveryFileId && (
                <a href={`/api/files/${o.deliveryFileId}`} target="_blank" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 font-semibold text-[#f5c518]">
                  <Download className="h-4 w-4" /> {o.deliveryFileName || "Download document"}
                </a>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-black">Services &amp; payment</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {o.items.map((i) => (
              <li key={i.slug} className="flex justify-between gap-3 py-2"><span>{i.title}</span><b className="whitespace-nowrap">{formatPKR(i.price)}</b></li>
            ))}
            <li className="flex justify-between py-2 text-lg font-black"><span>Total</span><span>{formatPKR(o.total)}</span></li>
          </ul>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <Row k="Payment method" v={o.paymentMethod} />
            <Row k="Transaction ID" v={o.transactionId} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-black">Details you submitted</h2>
          <div className="mt-2 divide-y divide-slate-100">
            <Row k="Name" v={o.name} />
            <Row k="Phone" v={o.phone} />
            <Row k="Email" v={o.email} />
            <Row k="Country" v={o.country} />
            <Row k="CNIC" v={o.cnic} />
          </div>
          {o.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{o.notes}</p>}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-black">Documents you uploaded</h2>
          <p className="mb-3 text-xs text-slate-500">Only you and our team can see these.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {gallery.map((g) => (
              <a key={g.id} href={`/api/files/${g.id}`} target="_blank" className="overflow-hidden rounded-xl border border-slate-200 hover:border-black">
                <p className="bg-slate-50 px-3 py-2 text-xs font-bold">{g.label}</p>
                {g.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${g.id}`} alt={g.label} loading="lazy" className="h-44 w-full bg-slate-100 object-contain" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-slate-100 font-bold text-slate-500">📄 PDF</div>
                )}
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-black">Order history</h2>
          <ol className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
            {events.map((e) => (
              <li key={hex(e._id)} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-black" />
                <p className="text-sm font-semibold">{e.title}</p>
                {e.note && <p className="whitespace-pre-wrap text-sm text-slate-600">{e.note}</p>}
                <p className="text-xs text-slate-400">{e.createdAt.toLocaleString("en-GB")}</p>
              </li>
            ))}
          </ol>
        </section>

        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, my order number is ${o.orderNo}. I want to ask about my order.`)}`}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl bg-green-500 py-3 text-center text-sm font-bold text-white"
        >
          Ask about this order on WhatsApp
        </a>
      </main>
      <Footer />
    </div>
  );
}

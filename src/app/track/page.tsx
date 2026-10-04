import { CheckCircle2, Cog, Download, Search } from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import ResubmitForm from "@/frontend/components/ResubmitForm";
import { cols, hex, type Order } from "@/backend/mongo";
import { normPhone } from "@/backend/admin";
import { ORDER_STATUS, SITE, formatPKR } from "@/shared/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track Order — I Series Digital Services" };

const STEPS = [
  { key: "pending_review", label: "Order placed", sub: "Payment under review" },
  { key: "processing", label: "In process", sub: "We are working on it" },
  { key: "completed", label: "Process done", sub: "Service delivered" },
];

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const sp = await searchParams;
  const orderNo = (sp.order || "").trim().toUpperCase();
  const phone = sp.phone || "";
  let order: Order | null = null;
  let searched = false;
  if (orderNo && phone) {
    searched = true;
    const { orders } = await cols();
    const o = await orders.findOne({ orderNo });
    if (o && normPhone(o.phone) === normPhone(phone)) order = o;
  }
  const events = order ? await (await cols()).orderEvents.find({ orderId: hex(order._id) }).sort({ createdAt: 1 }).toArray() : [];
  const status = order ? (order.status === "approved" ? "processing" : order.status) : "";
  const st = order ? ORDER_STATUS[status] : null;
  const stepIdx = status === "completed" ? 2 : status === "processing" ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-black">Track Your Order</h1>
        <p className="mt-1 text-sm text-slate-600">Enter your order number and the phone number you used for the order.</p>
        <form className="mt-5 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5">
          <input name="order" defaultValue={sp.order} required placeholder="Order no. (PO-XXXXXX)" className="rounded-xl border border-slate-300 px-4 py-3 text-base uppercase sm:text-sm" />
          <input name="phone" defaultValue={sp.phone} required placeholder="Phone used in order" className="rounded-xl border border-slate-300 px-4 py-3 text-base sm:text-sm" />
          <button className="flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 font-semibold text-[#f5c518] hover:bg-neutral-800">
            <Search className="h-4 w-4" /> Track
          </button>
        </form>

        {searched && !order && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">Order not found. Please check the order number and phone number.</p>
        )}

        {order && st && (
          <div className="mt-6 space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Order</p>
                <p className="text-2xl font-black tracking-widest">{order.orderNo}</p>
              </div>
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${st.cls}`}>{st.short}</span>
            </div>

            {status === "completed" ? (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-900 ring-1 ring-green-300">
                <CheckCircle2 className="h-10 w-10 shrink-0 text-green-600" />
                <div>
                  <p className="text-lg font-black">Process done ✔</p>
                  <p className="text-sm">Your service is complete.</p>
                </div>
              </div>
            ) : status === "processing" ? (
              <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-blue-900 ring-1 ring-blue-200">
                <Cog className="h-10 w-10 shrink-0 animate-spin text-blue-600 [animation-duration:4s]" />
                <div>
                  <p className="text-lg font-black">Order is in process</p>
                  <p className="text-sm">Your payment is approved and our team is working on it.</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-start">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex flex-1 items-start last:flex-none">
                  <div className="flex w-16 flex-col items-center gap-1 sm:w-24">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
                        status === "rejected" && i === 0 ? "bg-red-500" : i <= stepIdx ? "bg-black" : "bg-slate-300"
                      }`}
                    >
                      {i < stepIdx || status === "completed" ? "✓" : i + 1}
                    </span>
                    <span className="text-center text-[11px] font-bold leading-tight">{s.label}</span>
                    <span className="hidden text-center text-[10px] leading-tight text-slate-500 sm:block">{s.sub}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`mt-4 h-1 flex-1 rounded ${i < stepIdx ? "bg-black" : "bg-slate-200"}`} />}
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-bold">Services</p>
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {order.items.map((i) => (
                  <li key={i.slug} className="flex justify-between gap-3 py-2">
                    <span>{i.title}</span>
                    <span className="whitespace-nowrap font-semibold">{formatPKR(i.price)}</span>
                  </li>
                ))}
                <li className="flex justify-between py-2 font-black">
                  <span>Total</span>
                  <span>{formatPKR(order.total)}</span>
                </li>
              </ul>
            </div>

            {status === "pending_review" && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Your payment slip is under review. Once the admin approves it, your order moves to &quot;In process&quot;.
              </p>
            )}
            {status === "rejected" && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">We could not verify your payment.</p>
                {order.adminNote && <p className="mt-1">Reason: {order.adminNote}</p>}
                <ResubmitForm orderNo={order.orderNo} phone={phone} />
              </div>
            )}
            {status === "completed" && (order.deliveryNote || order.deliveryFileId) && (
              <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
                {order.deliveryNote && <p className="whitespace-pre-wrap">{order.deliveryNote}</p>}
                {order.deliveryFileId && (
                  <a href={`/api/files/${order.deliveryFileId}`} target="_blank" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 font-semibold text-[#f5c518]">
                    <Download className="h-4 w-4" /> {order.deliveryFileName || "Download document"}
                  </a>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-bold">Order history</p>
              <ol className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                {[...events].reverse().map((e) => (
                  <li key={hex(e._id)} className="relative">
                    <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-black" />
                    <p className="text-sm font-semibold">{e.title}</p>
                    {e.note && <p className="whitespace-pre-wrap text-sm text-slate-600">{e.note}</p>}
                    <p className="text-xs text-slate-400">{e.createdAt.toLocaleString("en-GB")}</p>
                  </li>
                ))}
              </ol>
            </div>

            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, my order number is ${order.orderNo}. I want to ask about my order status.`)}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl bg-green-500 py-3 text-center text-sm font-bold text-white"
            >
              Ask about this order on WhatsApp
            </a>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

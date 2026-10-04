"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Landmark, Loader2, Smartphone, Upload } from "lucide-react";
import { useCart } from "./CartProvider";
import { PRICES, SITE, docsFor, formatPKR, getService } from "@/shared/site";

type Method = {
  id: string;
  kind: string;
  accountTitle: string;
  accountNumber: string;
  bankName: string | null;
  iban: string | null;
};

const LABEL: Record<string, string> = { easypaisa: "EasyPaisa", jazzcash: "JazzCash", bank: "Bank Transfer" };
const field =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-4 focus:ring-black/10 dark:focus:border-[#f5c518] dark:focus:ring-[#f5c518]/20";

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="ml-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
    >
      <Copy className="h-3 w-3" /> {ok ? "Copied" : "Copy"}
    </button>
  );
}

function DocUpload({ name, label, required }: { name: string; label: string; required: boolean }) {
  const [fileName, setFileName] = useState("");
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center hover:border-brand hover:bg-green-50/50">
      <Upload className="h-6 w-6 text-black" />
      <span className="text-sm font-semibold text-slate-700">{label} {required ? "*" : <i className="font-normal text-slate-400">(optional)</i>}</span>
      <span className="max-w-full truncate text-xs text-slate-500">{fileName || "JPG, PNG or PDF — max 5 MB"}</span>
      <input
        type="file"
        name={name}
        required={required}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
    </label>
  );
}

export default function CheckoutForm({ methods, user }: { methods: Method[]; user: { name: string; email: string; phone: string; country: string } }) {
  const { items, total, ready, clear } = useCart();
  const [methodId, setMethodId] = useState<string | null>(methods[0]?.id ?? null);
  const [slipName, setSlipName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ orderNo: string; phone: string; name: string; total: number; services: string[] } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!methodId) return setError("Please select a payment method.");
    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items));
    fd.set("methodId", String(methodId));
    const slip = fd.get("slip");
    if (!(slip instanceof File) || slip.size === 0) return setError("Please upload your payment slip.");
    if (slip.size > 5 * 1024 * 1024) return setError("Slip is too large (max 5 MB).");
    for (const d of docsFor(items)) {
      const f = fd.get(d.key);
      const has = f instanceof File && f.size > 0;
      if (!has && d.required) return setError(`Please upload: ${d.label}.`);
      if (has && f.size > 5 * 1024 * 1024) return setError(`${d.label} must be under 5 MB.`);
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/login?next=/checkout";
        return;
      }
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone({ orderNo: json.orderNo, phone: String(fd.get("phone")), name: String(fd.get("name")), total: json.total ?? total, services: items.map((s) => getService(s)?.title ?? s) });
      clear();
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl">
        <CheckCircle2 className="mx-auto h-16 w-16 text-black" />
        <h2 className="mt-4 text-2xl font-extrabold text-black">Order submitted!</h2>
        <p className="mt-2 text-slate-600">Your payment slip has reached the admin for review.</p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Your Order Number</p>
          <p className="mt-1 text-3xl font-black tracking-widest text-black">{done.orderNo}</p>
          <p className="mt-2 text-xs text-slate-500">A confirmation was sent to your email. Save this number to track your order.</p>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          The admin will verify and approve your payment, then your service will be delivered.
        </p>
        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, I placed order ${done.orderNo}.\nName: ${done.name}\nServices: ${done.services.join(", ")}\nTotal: ${formatPKR(done.total)}\nI have uploaded my payment slip.`)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-full bg-green-500 px-7 py-3 font-semibold text-white hover:bg-green-600"
        >
          Send order details on WhatsApp
        </a>
        <Link
          href={`/account/orders/${done.orderNo}`}
          className="mt-3 inline-block rounded-full bg-black px-7 py-3 font-semibold text-[#f5c518] hover:bg-neutral-800"
        >
          View my order &amp; track status
        </Link>
      </div>
    );
  }

  if (!ready) return null;
  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-700">Your cart is empty.</p>
        <Link href="/#services" className="mt-5 inline-block rounded-full bg-black px-6 py-3 font-semibold text-gold">
          Browse services
        </Link>
      </div>
    );
  }

  const selected = methods.find((m) => m.id === methodId);
  const docs = docsFor(items);

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-5">
      <div className="space-y-8 lg:col-span-3">
        {/* Details */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black">1. Your Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name *</label>
              <input name="name" required defaultValue={user.name} className={field} placeholder="Your full name" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone / WhatsApp *</label>
              <input name="phone" required defaultValue={user.phone} className={field} placeholder="+971 5X XXX XXXX" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
              <input name="email" type="email" required defaultValue={user.email} className={field} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Country</label>
              <input name="country" defaultValue={user.country} className={field} placeholder="UAE, KSA, UK..." />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">CNIC number *</label>
              <input name="cnic" required className={field} placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Details of your problem</label>
              <textarea name="notes" rows={3} className={field} placeholder="Describe your problem / any important details..." />
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black">2. Your Documents</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload clear copies of only the documents required for the services you selected. Only our team can see them (100% confidential).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <DocUpload key={d.key} name={d.key} label={d.label} required={d.required} />
            ))}
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black">3. Make Payment</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose a payment method below and send <b>{formatPKR(total)}</b> to that account.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition ${
                  methodId === m.id ? "border-brand bg-green-50 text-black" : "border-slate-200 text-slate-700 hover:border-slate-400"
                }`}
              >
                {m.kind === "bank" ? <Landmark className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                {LABEL[m.kind] ?? m.kind}
              </button>
            ))}
          </div>
          {methods.length === 0 && <p className="mt-4 text-sm text-red-600">No payment methods available. Please contact us.</p>}
          {selected && (
            <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-5 text-sm">
              <p className="font-bold text-black">{LABEL[selected.kind]} account details</p>
              <p>
                <span className="text-slate-500">Account title:</span> <b>{selected.accountTitle}</b>
              </p>
              {selected.bankName && (
                <p>
                  <span className="text-slate-500">Bank:</span> <b>{selected.bankName}</b>
                </p>
              )}
              <p>
                <span className="text-slate-500">{selected.kind === "bank" ? "IBAN / Account no:" : "Number:"}</span>{" "}
                <b className="break-anywhere tracking-wide">{selected.accountNumber}</b>
                <CopyBtn text={selected.accountNumber} />
              </p>
              {selected.iban && (
                <p>
                  <span className="text-slate-500">IBAN:</span> <b className="break-anywhere tracking-wide">{selected.iban}</b>
                  <CopyBtn text={selected.iban} />
                </p>
              )}
              <p>
                <span className="text-slate-500">Amount to send:</span> <b className="text-black">{formatPKR(total)}</b>
              </p>
            </div>
          )}
        </section>

        {/* Slip */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black">4. Upload Payment Slip</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Transaction ID (TID / Ref no.)</label>
              <input name="transactionId" className={field} placeholder="Optional — printed on your slip" />
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-brand hover:bg-green-50/50">
              <Upload className="h-8 w-8 text-black" />
              <span className="text-sm font-semibold text-slate-700">{slipName || "Click to upload slip / screenshot"}</span>
              <span className="text-xs text-slate-500">JPG, PNG, WEBP or PDF — max 5 MB</span>
              <input
                type="file"
                name="slip"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                className="hidden"
                onChange={(e) => setSlipName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:col-span-2">
        <h2 className="text-lg font-bold text-black">Order Summary</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {items.map((slug) => (
            <li key={slug} className="flex justify-between gap-3 py-2.5">
              <span className="text-slate-700">{getService(slug)?.title}</span>
              <span className="whitespace-nowrap font-semibold">{formatPKR(PRICES[slug] ?? 0)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-extrabold text-black">
          <span>Total</span>
          <span>{formatPKR(total)}</span>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 font-semibold text-gold shadow-lg hover:bg-neutral-800 disabled:opacity-70"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />} Submit Order &amp; Payment Slip
        </button>
        <Link href="/cart" className="block text-center text-sm text-slate-500 hover:underline">
          ← Back to cart
        </Link>
      </aside>
    </form>
  );
}

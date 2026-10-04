"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { SERVICES } from "@/shared/site";

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-black focus:ring-4 focus:ring-black/10 dark:focus:border-[#f5c518] dark:focus:ring-[#f5c518]/20";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("idle");
        return;
      }
      form.reset();
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-xl">
        <CheckCircle2 className="h-16 w-16 text-black" />
        <h3 className="mt-4 text-2xl font-bold text-slate-900">Thank you! We received your inquiry.</h3>
        <p className="urdu mt-2 text-slate-600">آپ کا اعتماد ہماری کامیابی ہے</p>
        <p className="mt-2 text-sm text-slate-600">Our team will contact you shortly.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-black"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name *</label>
          <input name="name" required className={field} placeholder="Your full name" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone / WhatsApp *</label>
          <input name="phone" required className={field} placeholder="+971 5X XXX XXXX" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" className={field} placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Country</label>
          <input name="country" className={field} placeholder="UAE, Saudi Arabia, UK..." />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Service *</label>
        <select name="service" required defaultValue="" className={field}>
          <option value="" disabled>
            Select a service
          </option>
          {SERVICES.map((s) => (
            <option key={s.slug} value={s.title}>
              {s.title}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Your problem / message</label>
        <textarea name="message" rows={4} className={field} placeholder="Briefly describe your problem..." />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-gold shadow-lg transition hover:bg-neutral-800 disabled:opacity-70"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Send Inquiry
      </button>
      <p className="text-center text-xs text-slate-500">🔒 Your information is 100% confidential.</p>
    </form>
  );
}

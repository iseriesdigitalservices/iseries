"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ExternalLink, Gift, Loader2, MailCheck, ShieldCheck } from "lucide-react";

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-4 focus:ring-black/10 dark:focus:border-[#f5c518] dark:focus:ring-[#f5c518]/20";

export function PasswordInput({ name, placeholder, autoComplete, minLength }: { name: string; placeholder?: string; autoComplete?: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete} placeholder={placeholder} className={`${field} pr-12`} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-black dark:hover:text-white">
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

export default function AuthForm({ mode, next, refCode }: { mode: "login" | "register"; next: string; refCode: string }) {
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const isReg = mode === "register";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBlocked(false);
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(isReg ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      if (json.pending) {
        setPending(true);
        setLoading(false);
        return;
      }
      const me = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()).catch(() => ({ user: null }));
      if (!me.user) {
        setBlocked(true);
        setLoading(false);
        return;
      }
      window.location.assign(next);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <MailCheck className="mx-auto h-14 w-14 text-green-600" />
        <h1 className="mt-4 text-2xl font-black">Account created</h1>
        <p className="mt-2 text-sm text-slate-600">Your account is waiting for approval by our team. You will be able to log in as soon as it is approved.</p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-semibold text-[#f5c518]">Go to login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:p-8">
      <div>
        <h1 className="text-2xl font-black">{isReg ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isReg ? "Create an account to place orders, track them and earn 10% with Refer & Earn." : "Log in to your account."}
        </p>
      </div>

      {isReg && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name *</label>
            <input name="name" required autoComplete="name" className={field} placeholder="Your full name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone / WhatsApp *</label>
              <input name="phone" required autoComplete="tel" inputMode="tel" className={field} placeholder="+971 5X XXX XXXX" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Country</label>
              <input name="country" className={field} placeholder="UAE, KSA, UK..." />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
        <input name="email" type="email" required autoComplete="email" inputMode="email" className={field} placeholder="you@example.com" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">Password *</label>
          {!isReg && (
            <Link href="/forgot-password" className="text-xs font-semibold underline">Forgot password?</Link>
          )}
        </div>
        <PasswordInput name="password" minLength={isReg ? 8 : undefined} autoComplete={isReg ? "new-password" : "current-password"} placeholder={isReg ? "At least 8 characters, letters + numbers" : "Your password"} />
      </div>

      {isReg && (
        <>
          <div className="rounded-2xl bg-[#f6f4ef] p-4">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Gift className="h-4 w-4" /> Referral code (if someone invited you)
            </label>
            <input name="ref" defaultValue={refCode} className={`${field} uppercase tracking-widest`} placeholder="IS••••••" />
          </div>
          <p className="flex gap-2 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Our support team can view your account details (including your password) to help you when you need support. Do not reuse a password from another website.
          </p>
        </>
      )}

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>}
      {blocked && (
        <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p>Your browser is blocking cookies inside this preview frame. Please open the website in a <b>new tab</b>:</p>
          <a href={typeof window !== "undefined" ? window.location.href : "/"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline">
            <ExternalLink className="h-4 w-4" /> Open in a new tab
          </a>
        </div>
      )}

      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-[#f5c518] hover:bg-neutral-800 disabled:opacity-70">
        {loading && <Loader2 className="h-5 w-5 animate-spin" />} {isReg ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isReg ? (
          <>
            Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-black underline">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-black underline">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}

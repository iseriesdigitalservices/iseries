"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { PasswordInput } from "./AuthForm";

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-4 focus:ring-black/10 dark:focus:border-[#f5c518] dark:focus:ring-[#f5c518]/20";

export default function ForgotForm() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendCode(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const value = e ? String(new FormData(e.currentTarget).get("email") || "") : email;
    const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: value }) });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(json.error || "Something went wrong.");
    setEmail(value.trim().toLowerCase());
    setInfo(json.message || "A code was sent.");
    setStep("code");
  }

  async function reset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) return setError("The two passwords do not match.");
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: fd.get("code"), password: fd.get("password") }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(json.error || "Something went wrong.");
    setStep("done");
  }

  if (step === "done")
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h1 className="mt-4 text-2xl font-black">Password changed</h1>
        <p className="mt-2 text-sm text-slate-600">Your password was reset. You can now log in with your new password.</p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-semibold text-[#f5c518]">Go to login</Link>
      </div>
    );

  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:p-8">
      <h1 className="text-2xl font-black">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-600">
        {step === "email" ? "Enter your account email. We will send a 6-digit code to it." : `We sent a 6-digit code to ${email}. It is valid for 10 minutes.`}
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input name="email" type="email" required autoComplete="email" inputMode="email" className={field} placeholder="you@example.com" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-[#f5c518] disabled:opacity-70">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />} Send code
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-5 space-y-4">
          {info && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">{info}</p>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">6-digit code</label>
            <input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className={`${field} text-center text-2xl font-bold tracking-[0.5em]`} placeholder="••••••" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <PasswordInput name="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters, letters + numbers" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
            <PasswordInput name="confirm" minLength={8} autoComplete="new-password" placeholder="Repeat the new password" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-[#f5c518] disabled:opacity-70">
            {loading && <Loader2 className="h-5 w-5 animate-spin" />} Reset password
          </button>
          <button type="button" disabled={loading} onClick={() => sendCode()} className="w-full text-center text-sm font-semibold underline">
            Did not get the code? Send again
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-slate-600">
        <Link href="/login" className="font-bold text-black underline">Back to login</Link>
      </p>
    </div>
  );
}

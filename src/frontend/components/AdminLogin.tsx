"use client";

import { useState } from "react";
<<<<<<< HEAD
import { ExternalLink, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { LogoMark } from "./Logo";
import ThemeToggle from "./ThemeToggle";

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-black focus:ring-4 focus:ring-black/10 dark:focus:border-[#f5c518] dark:focus:ring-[#f5c518]/20";

function Password({ name, placeholder, autoComplete }: { name: string; placeholder: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} placeholder={placeholder} className={`${field} pr-12`} />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-black dark:hover:text-white"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

export default function AdminLogin({ setup = false }: { setup?: boolean }) {
=======
import { ExternalLink, Loader2, Lock } from "lucide-react";
import { LogoMark } from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function AdminLogin() {
>>>>>>> origin/main
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBlocked(false);
    setLoading(true);
<<<<<<< HEAD
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
=======
    const password = String(new FormData(e.currentTarget).get("password") || "");
>>>>>>> origin/main
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ ...data, mode: setup ? "setup" : "login" }),
=======
        body: JSON.stringify({ password }),
>>>>>>> origin/main
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Login failed.");
        setLoading(false);
        return;
      }
      const me = await fetch("/api/admin/me", { credentials: "same-origin", cache: "no-store" }).then((r) => r.json()).catch(() => ({ ok: false }));
      if (!me.ok) {
        setBlocked(true);
        setLoading(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0a] p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle className="!bg-white/10 !text-[#f5c518]" />
      </div>
<<<<<<< HEAD
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <LogoMark className="mx-auto h-16 w-auto" />

        {setup ? (
          <>
            <h1 className="flex items-center justify-center gap-2 text-center text-xl font-extrabold">
              <ShieldCheck className="h-5 w-5" /> Create the admin account
            </h1>
            <p className="text-center text-sm text-slate-600">
              This is a one-time setup. Choose the email and password you will use to sign in from now on.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Setup key</label>
              <input name="setupKey" type="password" required autoComplete="off" placeholder="The ADMIN_PASSWORD from your .env" className={field} />
              <p className="mt-1 text-xs text-slate-500">Proves it is really you. It is the <code>ADMIN_PASSWORD</code> value in the environment settings.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Your name</label>
              <input name="name" required autoComplete="name" placeholder="e.g. Muhammad Naeem" className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Login email</label>
              <input name="email" type="email" required autoComplete="username" placeholder="you@example.com" className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Password name="password" autoComplete="new-password" placeholder="10+ chars, upper, lower and a number" />
            </div>
          </>
        ) : (
          <>
            <h1 className="flex items-center justify-center gap-2 text-center text-xl font-extrabold">
              <Lock className="h-5 w-5" /> Admin sign in
            </h1>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" required autoFocus autoComplete="username" inputMode="email" placeholder="you@example.com" className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Password name="password" autoComplete="current-password" placeholder="Your admin password" />
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
=======
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <LogoMark className="mx-auto h-20 w-auto" />
        <h1 className="flex items-center justify-center gap-2 text-center text-xl font-extrabold">
          <Lock className="h-5 w-5" /> Admin Login
        </h1>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Admin password"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-black dark:focus:border-[#f5c518]"
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
>>>>>>> origin/main
        {blocked && (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <p>Your browser is blocking cookies inside this preview frame. Open the admin panel in a <b>new tab</b>:</p>
            <a href="/admin" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline">
              <ExternalLink className="h-4 w-4" /> Open admin in a new tab
            </a>
          </div>
        )}
<<<<<<< HEAD

        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-semibold text-[#f5c518] hover:bg-neutral-800 disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {setup ? "Create account & sign in" : "Sign in"}
        </button>

        <p className="text-center text-xs text-slate-500">
          For your security the session ends when you leave the admin panel, and after 60 minutes of inactivity.
        </p>
=======
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-semibold text-[#f5c518] hover:bg-neutral-800 disabled:opacity-70">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
        <p className="text-center text-xs text-slate-500">For your security the admin session ends automatically when you leave the admin panel.</p>
>>>>>>> origin/main
      </form>
    </main>
  );
}

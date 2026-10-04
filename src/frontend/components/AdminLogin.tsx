"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Lock } from "lucide-react";
import { LogoMark } from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBlocked(false);
    setLoading(true);
    const password = String(new FormData(e.currentTarget).get("password") || "");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
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
        {blocked && (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <p>Your browser is blocking cookies inside this preview frame. Open the admin panel in a <b>new tab</b>:</p>
            <a href="/admin" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline">
              <ExternalLink className="h-4 w-4" /> Open admin in a new tab
            </a>
          </div>
        )}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-semibold text-[#f5c518] hover:bg-neutral-800 disabled:opacity-70">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
        <p className="text-center text-xs text-slate-500">For your security the admin session ends automatically when you leave the admin panel.</p>
      </form>
    </main>
  );
}

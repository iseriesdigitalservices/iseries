"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";

type Entry = { password: string | null; setAt: string; how: string; retiredAt?: string };

const fmt = (d?: string) => (d ? new Date(d).toLocaleString("en-GB") : "");

export default function PasswordReveal({ userId }: { userId: string }) {
  const [data, setData] = useState<{ current: Entry | null; history: Entry[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function reveal() {
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.set("_action", "user_reveal");
    fd.set("userId", userId);
    const res = await fetch("/api/admin/action", { method: "POST", body: fd, credentials: "same-origin" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) return void (window.location.href = "/admin");
    if (!res.ok) return setError(json.message || "Could not load.");
    setData({ current: json.current, history: json.history });
  }

  if (!data)
    return (
      <div>
        <button onClick={reveal} disabled={loading} className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-[#f5c518] disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Show current &amp; previous passwords
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current password</p>
        {data.current ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-lg bg-slate-100 px-3 py-2 text-base font-bold">{data.current.password ?? "— could not be decrypted —"}</code>
            {data.current.password && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(data.current!.password!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold ring-1 ring-slate-300"
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            )}
            <span className="text-xs text-slate-500">
              {data.current.how} · {fmt(data.current.setAt)}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Not available for this account.</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Previous passwords ({data.history.length})</p>
        {data.history.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">The user has never changed their password.</p>
        ) : (
          <ul className="mt-1 divide-y divide-slate-100 text-sm">
            {data.history.map((h, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <code className="break-all rounded bg-slate-100 px-2 py-1 font-semibold">{h.password ?? "— could not be decrypted —"}</code>
                <span className="text-xs text-slate-500">
                  {h.how} · used {fmt(h.setAt)} → replaced {fmt(h.retiredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={() => setData(null)} className="flex items-center gap-2 text-sm font-semibold underline">
        <EyeOff className="h-4 w-4" /> Hide
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const field = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base outline-none focus:border-black sm:text-sm";

type U = { name: string; email: string; phone: string; country: string | null; payoutAccount: string | null };

export default function ProfileForm({ user }: { user: U }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/auth/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "same-origin" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: json.error || "Could not save." });
    setMsg({ ok: true, text: "Profile saved ✓" });
    (e.currentTarget as HTMLFormElement | null)?.querySelectorAll<HTMLInputElement>("input[type=password]").forEach((i) => (i.value = ""));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Full name</label>
          <input name="name" required defaultValue={user.name} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Email (login)</label>
          <input value={user.email} readOnly className={`${field} bg-slate-50 text-slate-500`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Phone / WhatsApp</label>
          <input name="phone" required defaultValue={user.phone} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Country</label>
          <input name="country" defaultValue={user.country ?? ""} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">Where should we send your referral earnings? (JazzCash / EasyPaisa / bank account)</label>
          <input name="payoutAccount" defaultValue={user.payoutAccount ?? ""} className={field} placeholder="e.g. JazzCash 0300-1234567 (Ali Khan)" />
        </div>
      </div>
      <details className="rounded-xl bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Change password (optional)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="currentPassword" type="password" placeholder="Current password" autoComplete="current-password" className={field} />
          <input name="newPassword" type="password" placeholder="New password (min 8, letters + numbers)" autoComplete="new-password" className={field} />
        </div>
      </details>
      {msg && <p className={`rounded-lg px-3 py-2 text-sm font-medium ${msg.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{msg.text}</p>}
      <button disabled={busy} className="flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-[#f5c518] disabled:opacity-70">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
      </button>
    </form>
  );
}

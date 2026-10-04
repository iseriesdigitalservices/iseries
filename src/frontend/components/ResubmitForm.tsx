"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResubmitForm({ orderNo, phone }: { orderNo: string; phone: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("orderNo", orderNo);
    fd.set("phone", phone);
    const res = await fetch("/api/orders/resubmit", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(json.error || "Something went wrong.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-xl bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">Upload a new / correct payment slip</p>
      <input name="transactionId" placeholder="Transaction ID (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input name="slip" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Uploading..." : "Resubmit slip"}
      </button>
    </form>
  );
}

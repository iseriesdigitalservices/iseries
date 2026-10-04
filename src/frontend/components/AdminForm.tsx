"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  action: string;
  children: ReactNode;
  className?: string;
  confirm?: string;
  /** after success navigate here (e.g. after logout) */
  redirectTo?: string;
  hidden?: Record<string, string | number>;
  /** when true, clicking a submit button with name/value adds it to the data */
  inline?: boolean;
};

/** Posts to /api/admin/action with fetch (cookie session), shows result, refreshes server data. */
export default function AdminForm({ action, children, className, confirm: confirmMsg, redirectTo, hidden, inline }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (sub?.name) fd.set(sub.name, sub.value);
    fd.set("_action", action);
    for (const [k, v] of Object.entries(hidden ?? {})) fd.set(k, String(v));
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/action", { method: "POST", body: fd, credentials: "same-origin" });
      const json = await res.json().catch(() => ({ ok: false, message: "Server error." }));
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      setMsg({ ok: !!json.ok, text: json.message || (json.ok ? "Done" : "Failed") });
      if (json.ok) {
        if (json.reset) ref.current?.reset();
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Network error. Please try again." });
    }
    setBusy(false);
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      <fieldset disabled={busy} className={inline ? "contents" : "min-w-0 space-y-3 border-0 p-0"}>
        {children}
      </fieldset>
      {busy && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Please wait...
        </p>
      )}
      {msg && (
        <p className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${msg.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{msg.text}</p>
      )}
    </form>
  );
}

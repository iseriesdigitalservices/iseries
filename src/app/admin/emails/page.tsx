import { cols } from "@/backend/mongo";
import { isAdmin } from "@/backend/admin";
import AdminForm from "@/frontend/components/AdminForm";
import Pager, { PAGE_SIZE, pageFrom } from "@/frontend/components/Pager";
import { ADMIN_EMAIL, getSetting, mailConfigured } from "@/backend/mail";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-black";
const color: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  not_configured: "bg-amber-100 text-amber-800",
};

export default async function NotificationsAdmin({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const smtp = await mailConfigured();
  const waKey = (process.env.CALLMEBOT_KEY || (await getSetting("wa_key"))) ?? "";
  const waPhone = (await getSetting("wa_phone")) ?? "923417427464";
  const sp = await searchParams;
  const { emailLogs } = await cols();
  const total = await emailLogs.countDocuments();
  const { page, pages, skip } = pageFrom(sp.page, total);
  const logs = await emailLogs.find().sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).toArray();
  const [relayOkDoc, relayFailDoc] = await Promise.all([
    emailLogs.findOne({ kind: "admin_alert", status: "sent" }),
    emailLogs.find({ kind: "admin_alert", status: "failed" }).sort({ createdAt: -1 }).limit(1).next(),
  ]);
  const relayOk = Boolean(relayOkDoc);
  const relayErr = relayFailDoc?.error;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black">Notifications</h1>
      <p className="text-sm text-slate-600">
        Every new order, inquiry, payment slip, user event, admin login and admin action is sent as an alert to <b>{ADMIN_EMAIL}</b>
        {waKey ? " and on WhatsApp." : "."}
      </p>

      {/* EMAIL */}
      <section className={`rounded-2xl p-5 ring-1 ${smtp || relayOk ? "bg-green-50 ring-green-200" : "bg-amber-50 ring-amber-300"}`}>
        <h2 className="font-bold">✉ Email alerts → {ADMIN_EMAIL}</h2>
        <p className="mt-1 text-sm text-slate-700">
          {smtp
            ? "✅ Gmail connected — admin alerts and customer emails are both sent from Gmail."
            : relayOk
              ? "✅ Admin alerts are working (free relay). Connect Gmail below to also email customers."
              : "⚠ Emails are not being delivered yet. Complete Step 1 below."}
        </p>

        {!smtp && (
          <div className="mt-4 space-y-4 rounded-xl bg-white p-4 text-sm">
            <div>
              <p className="font-bold">Step 1 — Activate the free relay (1 click)</p>
              <p className="text-slate-600">
                Click &quot;Send test email&quot; below. An email from FormSubmit will arrive in the <b>{ADMIN_EMAIL}</b> inbox (or spam) — in it click{" "}
                <b>Activate Form</b>. After that all admin alerts will arrive at this email.
              </p>
              {relayErr && <p className="mt-1 text-xs text-red-600">Last status: {relayErr}</p>}
            </div>
            <div>
              <p className="font-bold">Step 2 (recommended) — Gmail App Password</p>
              <p className="text-slate-600">
                This also lets us email customers (OTP codes, order updates) and attach the slip/documents to alerts. Turn on 2-Step Verification in Gmail, then{" "}
                <a className="font-semibold underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">
                  myaccount.google.com/apppasswords
                </a>{" "}
                create a 16-letter App Password and paste it here:
              </p>
              <AdminForm action="smtp_save" className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input name="pass" required placeholder="xxxx xxxx xxxx xxxx" autoComplete="off" className={inp} />
                <button className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-[#f5c518]">Connect</button>
              </AdminForm>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <AdminForm action="test_mail" inline>
            <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-[#f5c518]">Send test email</button>
          </AdminForm>
          {smtp && (
            <AdminForm action="smtp_remove" inline confirm="Remove the saved Gmail password?">
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300">Disconnect Gmail</button>
            </AdminForm>
          )}
        </div>
      </section>

      {/* WHATSAPP */}
      <section className={`rounded-2xl p-5 ring-1 ${waKey ? "bg-green-50 ring-green-200" : "bg-white ring-slate-200"}`}>
        <h2 className="font-bold">💬 WhatsApp alerts</h2>
        <p className="mt-1 text-sm text-slate-700">
          {waKey ? `✅ Connected — alerts will arrive as WhatsApp messages on +${waPhone}.` : "Not connected yet. (After placing an order customers also get a WhatsApp button that messages you — it needs no setup.)"}
        </p>
        {!waKey && (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>
              <a className="font-semibold underline" href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noreferrer">
                callmebot.com/blog/free-api-whatsapp-messages
              </a>{" "}
              and message the CallMeBot number shown there on WhatsApp{" "}
              <i>&quot;I allow callmebot to send me messages&quot;</i> (from the company number).
            </li>
            <li>You will receive an <b>API key</b> in reply.</li>
            <li>Enter the number and API key below and click Connect.</li>
          </ol>
        )}
        <AdminForm action="wa_save" className="mt-3 grid gap-2 sm:grid-cols-3">
          <input name="phone" defaultValue={waPhone} placeholder="923417427464" className={inp} />
          <input name="key" defaultValue={waKey} placeholder="CallMeBot API key" autoComplete="off" className={inp} />
          <button className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-[#f5c518]">{waKey ? "Update" : "Connect"}</button>
        </AdminForm>
        {waKey && (
          <div className="mt-3 flex flex-wrap gap-3">
            <AdminForm action="wa_test" inline>
              <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-[#f5c518]">Send test WhatsApp</button>
            </AdminForm>
            <AdminForm action="wa_remove" inline confirm="Turn off WhatsApp alerts?">
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300">Disconnect</button>
            </AdminForm>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">✉ Compose email</h2>
        <AdminForm action="send_mail">
          <input name="to" type="email" required placeholder="Recipient email" className={inp} />
          <input name="subject" required placeholder="Subject" className={inp} />
          <textarea name="body" required rows={5} placeholder="Message..." className={inp} />
          <input name="file" type="file" className="block w-full text-sm" />
          <button className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-[#f5c518]">Send</button>
        </AdminForm>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Notification log</h2>
          <span className="text-xs text-slate-500">{total} total</span>
        </div>
        {logs.length === 0 && <p className="text-sm text-slate-500">Nothing has been sent yet.</p>}
        <div className="divide-y divide-slate-100">
          {logs.map((l) => (
            <details key={String(l._id)} className="py-2.5">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {l.kind === "whatsapp" ? "💬 " : "✉ "}
                  <b>{l.subject}</b> <span className="text-slate-500">→ {l.toEmail}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  {l.createdAt.toLocaleString("en-GB")}
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold ${color[l.status]}`}>{l.status}</span>
                </span>
              </summary>
              {l.error && <p className="mt-2 text-xs text-red-600">{l.error}</p>}
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{l.body}</pre>
            </details>
          ))}
        </div>
        <Pager basePath="/admin/emails" page={page} pages={pages} total={total} label="notifications" />
      </section>
    </div>
  );
}

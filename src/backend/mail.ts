import "server-only"; // backend only — never bundled into the browser
import nodemailer from "nodemailer";
import { headers } from "next/headers";
import { ObjectId, cols } from "@/backend/mongo";
import { SITE } from "@/shared/site";

/** Where admin notifications go. */
export const ADMIN_EMAIL = process.env.NOTIFY_EMAIL || SITE.email;

export async function getSetting(key: string): Promise<string | null> {
  try {
    const { settings } = await cols();
    return (await settings.findOne({ _id: key }))?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string) {
  const { settings } = await cols();
  await settings.updateOne({ _id: key }, { $set: { value, updatedAt: new Date() } }, { upsert: true });
}

export async function deleteSetting(key: string) {
  const { settings } = await cols();
  await settings.deleteOne({ _id: key });
}

export async function addLog(l: { kind: string; toEmail: string; subject: string; body: string; status: string; error?: string | null; orderId?: string | null }) {
  try {
    const { emailLogs } = await cols();
    await emailLogs.insertOne({
      _id: new ObjectId(),
      kind: l.kind,
      toEmail: l.toEmail,
      subject: l.subject.slice(0, 300),
      body: l.body.slice(0, 5000),
      status: l.status,
      error: l.error ?? null,
      orderId: l.orderId ?? null,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("[mail-log]", e);
  }
}

type Creds = { user: string; pass: string; host: string; port: number };

async function creds(): Promise<Creds | null> {
  const pass = (process.env.SMTP_PASS || (await getSetting("smtp_pass")) || "").replace(/\s+/g, "");
  if (!pass) return null;
  const user = process.env.SMTP_USER || (await getSetting("smtp_user")) || SITE.email;
  return { user, pass, host: process.env.SMTP_HOST || "smtp.gmail.com", port: Number(process.env.SMTP_PORT || 465) };
}

export async function mailConfigured() {
  return (await creds()) !== null;
}

export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
  kind: "admin_alert" | "customer_notice" | "manual" | "test";
  orderId?: string | null;
  /** What to store in the log instead of the real text (e.g. to hide one-time codes). */
  logText?: string;
};

/** Keyless relay (FormSubmit) — only for mail addressed to the company inbox when SMTP is not set up. */
async function relayToAdmin(m: MailInput): Promise<{ ok: boolean; error?: string }> {
  // While the one-time activation is pending, don't re-trigger activation emails on every alert.
  if (m.kind !== "test") {
    const wait = Number((await getSetting("relay_wait")) || 0);
    if (wait > Date.now()) return { ok: false, error: "Relay activation pending — click 'Activate Form' in the FormSubmit email in your inbox." };
  }
  try {
    const origin = await baseUrl();
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(ADMIN_EMAIL)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Origin: origin, Referer: origin + "/" },
      body: JSON.stringify({
        _subject: m.subject,
        _template: "box",
        _captcha: "false",
        ...(m.replyTo ? { _replyto: m.replyTo, email: m.replyTo } : {}),
        message: m.text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const j = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
    if (res.ok && (j.success === true || j.success === "true")) {
      await deleteSetting("relay_wait");
      return { ok: true };
    }
    if (/activat/i.test(j.message || "")) await setSetting("relay_wait", String(Date.now() + 10 * 60_000));
    return { ok: false, error: (j.message || `Relay HTTP ${res.status}`).slice(0, 300) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "Relay failed" };
  }
}

/** Sends an email and records it in email_logs. Never throws. */
export async function sendMail(m: MailInput): Promise<{ ok: boolean; error?: string }> {
  let status: "sent" | "failed" | "not_configured" = "sent";
  let error: string | null = null;
  const c = await creds();
  if (c) {
    try {
      const tx = nodemailer.createTransport({
        host: c.host,
        port: c.port,
        secure: c.port === 465,
        auth: { user: c.user, pass: c.pass },
      });
      const msg = {
        from: `"${SITE.name}" <${c.user}>`,
        to: m.to,
        subject: m.subject,
        html: m.html,
        text: m.text,
        replyTo: m.replyTo,
        attachments: m.attachments,
      };
      // Gmail sometimes answers 421/450/451/452 ("temporary problem") — retry a couple of times.
      for (let attempt = 1; ; attempt++) {
        try {
          await tx.sendMail(msg);
          break;
        } catch (err) {
          const code = (err as { responseCode?: number }).responseCode ?? 0;
          if (attempt >= 3 || ![421, 450, 451, 452].includes(code)) throw err;
          await new Promise((r) => setTimeout(r, 2500 * attempt));
        }
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message.slice(0, 500) : "Unknown error";
      console.error("[mail]", error);
    }
  } else if (m.to.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const r = await relayToAdmin(m);
    if (!r.ok) {
      status = "failed";
      error = `Relay: ${r.error}`;
    }
  } else {
    status = "not_configured";
    error = "Customer emails need the Gmail App Password (Admin → Notifications).";
  }
  await addLog({ kind: m.kind, toEmail: m.to, subject: m.subject, body: m.logText ?? m.text, status, error, orderId: m.orderId ?? null });
  return status === "sent" ? { ok: true } : { ok: false, error: error ?? "failed" };
}

export async function baseUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
    const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return "http://localhost:3000";
  }
}

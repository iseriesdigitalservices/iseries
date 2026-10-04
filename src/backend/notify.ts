import "server-only"; // backend only — never bundled into the browser
import { addLog, getSetting, sendMail, ADMIN_EMAIL, type MailAttachment } from "@/backend/mail";
import { adminAlert } from "@/backend/emailTemplates";
import { SITE } from "@/shared/site";

/** WhatsApp via CallMeBot (needs a one-time free API key saved in Admin → Notifications). */
export async function sendWhatsApp(text: string): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = (process.env.CALLMEBOT_KEY || (await getSetting("wa_key"))) ?? "";
  if (!key) return { ok: false, skipped: true };
  const phone = (process.env.CALLMEBOT_PHONE || (await getSetting("wa_phone")) || SITE.whatsapp).replace(/\D/g, "");
  let status = "sent";
  let error: string | null = null;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text.slice(0, 1500))}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = (await res.text()).slice(0, 300);
    if (!res.ok) {
      status = "failed";
      error = `HTTP ${res.status}: ${body.replace(/<[^>]+>/g, " ").trim()}`;
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message.slice(0, 300) : "failed";
  }
  await addLog({ kind: "whatsapp", toEmail: phone, subject: "WhatsApp alert", body: text, status, error });
  return status === "sent" ? { ok: true } : { ok: false, error: error ?? "failed" };
}

export type AdminNotice = {
  title: string; // short headline
  lines: string[]; // key facts
  link?: string;
  orderId?: string | null;
  replyTo?: string;
  attachments?: MailAttachment[];
};

/** Alerts the company on every important action: email + WhatsApp (when configured). Never throws. */
export async function notifyAdmin(n: AdminNotice) {
  try {
    const a = adminAlert(n.title, n.lines, n.link);
    await sendMail({
      to: ADMIN_EMAIL,
      ...a,
      replyTo: n.replyTo,
      attachments: n.attachments,
      kind: "admin_alert",
      orderId: n.orderId ?? null,
    });
    await sendWhatsApp(`*${SITE.name}*\n${n.title}\n${n.lines.join("\n")}${n.link ? `\n${n.link}` : ""}`);
  } catch (e) {
    console.error("[notifyAdmin]", e);
  }
}

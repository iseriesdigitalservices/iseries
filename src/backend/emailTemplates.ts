import "server-only"; // backend only — never bundled into the browser
import type { Order } from "@/backend/mongo";
import { SITE, formatPKR } from "@/shared/site";

export function esc(s: string | null | undefined) {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function wrap(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#111">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#0a0a0a;border-radius:16px 16px 0 0;padding:22px 28px">
    <div style="color:#f5c518;font-size:22px;font-weight:800;letter-spacing:1px">${esc(SITE.name.toUpperCase())}</div>
    <div style="color:#bbb;font-size:12px;margin-top:4px">${esc(SITE.tagline)}</div>
  </div>
  <div style="background:#fff;padding:28px;border-radius:0 0 16px 16px;line-height:1.6;font-size:15px">
    <h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>
    ${bodyHtml}
    ${cta ? `<p style="margin:26px 0 6px"><a href="${esc(cta.url)}" style="background:#0a0a0a;color:#f5c518;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;display:inline-block">${esc(cta.label)}</a></p>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:26px 0 14px">
    <div style="font-size:12px;color:#777">${esc(SITE.name)} · ${SITE.phones.map((p) => esc(p.display)).join(" / ")} · ${esc(SITE.email)}</div>
  </div>
</div></body></html>`;
}

const lines = (o: Order) => o.items.map((i) => `${i.title} — ${formatPKR(i.price)}`);
const itemsHtml = (o: Order) =>
  `<ul style="padding-left:18px;margin:8px 0">${lines(o).map((l) => `<li>${esc(l)}</li>`).join("")}</ul><p style="margin:6px 0"><b>Total: ${esc(formatPKR(o.total))}</b></p>`;
const note = (n: string) => `<p style="background:#f6f4ef;padding:12px;border-radius:10px;white-space:pre-wrap">${esc(n)}</p>`;

export function orderReceivedCustomer(o: Order, url: string) {
  return {
    subject: `Order received — ${o.orderNo} | ${SITE.name}`,
    html: wrap(
      `Thank you ${o.name}! We received your order`,
      `<p>Your order number is <b style="font-size:18px;letter-spacing:1px">${esc(o.orderNo)}</b>.</p>${itemsHtml(o)}
       <p>Our team is verifying your payment slip. You will get an email as soon as it is approved. You can track your order at any time.</p>`,
      { label: "View my order", url },
    ),
    text: `Thank you ${o.name}! Order ${o.orderNo} received.\n${lines(o).join("\n")}\nTotal: ${formatPKR(o.total)}\nTrack: ${url}`,
  };
}

export function processingCustomer(o: Order, url: string) {
  return {
    subject: `Your order is now in process — ${o.orderNo}`,
    html: wrap(
      "Your order is in process ⚙️",
      `<p>Your payment has been verified and our team has started working on your case.</p>${o.adminNote ? note(o.adminNote) : ""}<p>You can follow the status on your order page. We will email you when the work is complete.</p>`,
      { label: "Track my order", url },
    ),
    text: `Order ${o.orderNo} is now in process. We are working on your case.${o.adminNote ? "\nNote: " + o.adminNote : ""}\nTrack: ${url}`,
  };
}

export function updateCustomer(o: Order, n: string, url: string) {
  return {
    subject: `Update on your order — ${o.orderNo}`,
    html: wrap("New update on your order", note(n), { label: "Track my order", url }),
    text: `Order ${o.orderNo} update:\n${n}\nTrack: ${url}`,
  };
}

export function statusCustomer(o: Order, status: "rejected" | "completed", url: string) {
  if (status === "rejected")
    return {
      subject: `Payment could not be verified — ${o.orderNo}`,
      html: wrap(
        "We could not verify your payment",
        `<p>Reason: <b>${esc(o.adminNote || "Payment could not be verified.")}</b></p><p>Please open your order and upload the correct payment slip again.</p>`,
        { label: "Open my order", url },
      ),
      text: `Payment for ${o.orderNo} could not be verified. Reason: ${o.adminNote ?? ""}\nPlease upload the slip again: ${url}`,
    };
  return {
    subject: `Service completed — ${o.orderNo}`,
    html: wrap(
      "Your service is complete 🎉",
      `${o.deliveryNote ? note(o.deliveryNote) : ""}<p>${o.deliveryFileId ? "The delivered document is attached to this email and is also available on your order page." : "You can see the details on your order page."}</p>`,
      { label: "View my order", url },
    ),
    text: `Service completed for ${o.orderNo}.\n${o.deliveryNote ?? ""}\nDetails: ${url}`,
  };
}

export function inquiryAckCustomer(name: string) {
  return {
    subject: `We received your inquiry — ${SITE.name}`,
    html: wrap(
      `Thank you ${name}!`,
      `<p>We received your inquiry and our team will contact you shortly.</p><p>For a faster reply call or WhatsApp: <b>${SITE.phones.map((p) => esc(p.display)).join(" · ")}</b></p>`,
    ),
    text: `Thank you ${name}! We received your inquiry and will contact you soon. ${SITE.phones.map((p) => p.display).join(" / ")}`,
  };
}

export function manualMessage(subject: string, body: string, cta?: { label: string; url: string }) {
  return { subject, html: wrap(subject, `<p style="white-space:pre-wrap">${esc(body)}</p>`, cta), text: body };
}

export function adminAlert(title: string, items: string[], link?: string) {
  return {
    subject: `🔔 ${title}`,
    html: wrap(title, `<ul style="padding-left:18px;margin:8px 0">${items.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`, link ? { label: "Open in admin", url: link } : undefined),
    text: `${title}\n${items.join("\n")}${link ? `\n${link}` : ""}`,
  };
}

export function commissionEarned(referrerName: string, amount: number, referredName: string, orderNo: string, balance: number, url: string) {
  return {
    subject: `You earned ${formatPKR(amount)} referral commission 🎉`,
    html: wrap(
      `Congratulations ${referrerName}!`,
      `<p><b>${esc(referredName)}</b> placed order <b>${esc(orderNo)}</b> and the payment was approved.</p>
       <p style="font-size:20px;margin:12px 0">Your 10% commission: <b>${esc(formatPKR(amount))}</b></p>
       <p>Your available balance: <b>${esc(formatPKR(balance))}</b>. The admin will deposit it to your account soon.</p>`,
      { label: "View my earnings", url },
    ),
    text: `${referredName} placed order ${orderNo}. Your commission: ${formatPKR(amount)}. Balance: ${formatPKR(balance)}. ${url}`,
  };
}

export function payoutSent(name: string, amount: number, n: string | null, balance: number, url: string) {
  return {
    subject: `Referral payout sent — ${formatPKR(amount)}`,
    html: wrap(
      "Your payout has been sent",
      `<p>Hi ${esc(name)}, <b>${esc(formatPKR(amount))}</b> of your referral earnings has been deposited.</p>${n ? note(n) : ""}<p>Remaining balance: <b>${esc(formatPKR(balance))}</b></p>`,
      { label: "View my account", url },
    ),
    text: `Payout of ${formatPKR(amount)} sent.${n ? "\n" + n : ""}\nRemaining balance: ${formatPKR(balance)}`,
  };
}

export function otpEmail(name: string, code: string) {
  return {
    subject: `${code} is your password reset code — ${SITE.name}`,
    html: wrap(
      "Reset your password",
      `<p>Hi ${esc(name)}, use this one-time code to reset your password:</p>
       <p style="font-size:34px;letter-spacing:10px;font-weight:800;margin:18px 0;text-align:center;background:#f6f4ef;padding:16px;border-radius:12px">${esc(code)}</p>
       <p>This code expires in <b>10 minutes</b>. If you did not ask for it, you can ignore this email — your password will not change.</p>`,
    ),
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    logText: "Password reset code (hidden)",
  };
}

export function passwordChangedNotice(name: string, how: string) {
  return {
    subject: `Your password was changed — ${SITE.name}`,
    html: wrap("Password changed", `<p>Hi ${esc(name)}, your account password was just changed (${esc(how)}).</p><p>If this was not you, contact us immediately: <b>${SITE.phones.map((p) => esc(p.display)).join(" · ")}</b></p>`),
    text: `Hi ${name}, your account password was changed (${how}). If this was not you, contact us immediately.`,
  };
}

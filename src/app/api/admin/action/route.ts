import { NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { ADMIN_COOKIE, isAdmin, revokeAdminSession } from "@/backend/admin";
import { logActivity } from "@/backend/activity";
import { checkPasswordStrength, hashPassword } from "@/backend/auth";
import { ADMIN_EMAIL, baseUrl, deleteSetting, sendMail, setSetting, type MailAttachment } from "@/backend/mail";
import { Binary, ObjectId, cols, hex, oid, type Order, type UserStatus } from "@/backend/mongo";
import { notifyAdmin, sendWhatsApp } from "@/backend/notify";
import { balanceFor, syncCommission } from "@/backend/referral";
import { clientIp, cookieOptions, rateLimit, sniffMime } from "@/backend/security";
import { decryptPw, nextVault } from "@/backend/vault";
import { commissionEarned, manualMessage, passwordChangedNotice, payoutSent, processingCustomer, statusCustomer, updateCustomer } from "@/backend/emailTemplates";
import { formatPKR } from "@/shared/site";

export const dynamic = "force-dynamic";

const ok = (message: string, extra: Record<string, unknown> = {}) => NextResponse.json({ ok: true, message, ...extra });
const bad = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });
const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES: UserStatus[] = ["active", "pending", "hold", "inactive"];

export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return bad("Invalid request.");
  const action = str(fd, "_action", 50);

  if (action === "logout") {
    const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
    await revokeAdminSession(m?.[1]);
    const res = ok("Logged out");
    res.cookies.set(ADMIN_COOKIE, "", cookieOptions(req, 0));
    return res;
  }

  if (!(await isAdmin())) return bad("Your session has ended. Please log in again.", 401);
  const rl = rateLimit(`admin-action:${clientIp(req)}`, 240, 60_000);
  if (!rl.ok) return bad("Too many requests. Slow down.", 429);

  const origin = await baseUrl();
  const c = await cols();

  // ---------- helpers
  const loadOrder = async (): Promise<Order | null> => {
    const _id = oid(str(fd, "id", 30));
    return _id ? c.orders.findOne({ _id }) : null;
  };
  const trackUrl = (o: Order) => (o.userId ? `${origin}/account/orders/${o.orderNo}` : `${origin}/track?order=${o.orderNo}&phone=${encodeURIComponent(o.phone)}`);
  const audit = (o: Order, what: string, extra: string[] = []) =>
    after(async () => {
      await notifyAdmin({
        title: `${what} — ${o.orderNo} (${o.name})`,
        lines: [`Action: ${what}`, `Order: ${o.orderNo}`, `Customer: ${o.name}`, ...extra],
        link: `${origin}/admin/orders/${hex(o._id)}`,
        orderId: hex(o._id),
      });
    });
  const later = (fn: () => Promise<unknown>) => after(async () => void (await fn().catch((e) => console.error(e))));
  const loadUser = async () => {
    const _id = oid(str(fd, "userId", 30));
    return _id ? c.users.findOne({ _id }) : null;
  };

  /** Referral: credit / cancel the 10% commission for this order and tell the referrer. */
  const referral = async (o: Order): Promise<string[]> => {
    const { created, referrer } = await syncCommission(o);
    if (!created || !referrer) return [];
    const { balance } = await balanceFor(hex(referrer._id));
    later(() =>
      sendMail({
        to: referrer.email,
        ...commissionEarned(referrer.name, created.amount, created.referredName, created.orderNo, balance, `${origin}/account`),
        kind: "customer_notice",
        orderId: hex(o._id),
      }),
    );
    return [`Referral commission ${formatPKR(created.amount)} credited to ${referrer.name} (${referrer.referralCode})`];
  };

  switch (action) {
    // ================= ORDERS =================
    case "order_processing": {
      const o = await loadOrder();
      if (!o) return bad("Order not found.", 404);
      const note = str(fd, "adminNote", 1000) || null;
      await c.orders.updateOne({ _id: o._id }, { $set: { status: "processing", adminNote: note, updatedAt: new Date() } });
      await c.orderEvents.insertOne({ _id: new ObjectId(), orderId: hex(o._id), status: "processing", title: "Payment approved — your order is now in process", note, createdAt: new Date() });
      const fresh: Order = { ...o, status: "processing", adminNote: note };
      if (o.email) later(() => sendMail({ to: o.email!, ...processingCustomer(fresh, trackUrl(o)), kind: "customer_notice", orderId: hex(o._id) }));
      const refLines = await referral(fresh);
      audit(o, "Order moved to IN PROCESS", [...(note ? [`Note: ${note}`] : []), ...refLines]);
      return ok(`Order is now "In process".${refLines.length ? " Referral commission credited." : ""}`);
    }
    case "order_reject": {
      const o = await loadOrder();
      if (!o) return bad("Order not found.", 404);
      const note = str(fd, "adminNote", 1000);
      if (!note) return bad("Please write the reason for rejection.");
      await c.orders.updateOne({ _id: o._id }, { $set: { status: "rejected", adminNote: note, updatedAt: new Date() } });
      await c.orderEvents.insertOne({ _id: new ObjectId(), orderId: hex(o._id), status: "rejected", title: "Payment could not be verified", note, createdAt: new Date() });
      const fresh: Order = { ...o, status: "rejected", adminNote: note };
      if (o.email) later(() => sendMail({ to: o.email!, ...statusCustomer(fresh, "rejected", trackUrl(o)), kind: "customer_notice", orderId: hex(o._id) }));
      await syncCommission(fresh);
      audit(o, "Payment REJECTED", [`Reason: ${note}`]);
      return ok("Payment rejected. The customer can upload a new slip.");
    }
    case "order_update": {
      const o = await loadOrder();
      if (!o) return bad("Order not found.", 404);
      const note = str(fd, "note", 1500);
      if (!note) return bad("Please write the update message.");
      await c.orderEvents.insertOne({ _id: new ObjectId(), orderId: hex(o._id), status: o.status, title: "Progress update", note, createdAt: new Date() });
      await c.orders.updateOne({ _id: o._id }, { $set: { updatedAt: new Date() } });
      if (fd.get("emailCustomer") === "on" && o.email) later(() => sendMail({ to: o.email!, ...updateCustomer(o, note, trackUrl(o)), kind: "customer_notice", orderId: hex(o._id) }));
      audit(o, "Progress update added", [`Update: ${note}`]);
      return ok("Update added to the customer's order page.");
    }
    case "order_complete": {
      const o = await loadOrder();
      if (!o) return bad("Order not found.", 404);
      const deliveryNote = str(fd, "deliveryNote", 3000);
      if (!deliveryNote) return bad("Please write the delivery message.");
      const set: Partial<Order> = { status: "completed", deliveryNote, updatedAt: new Date() };
      const attachments: MailAttachment[] = [];
      const file = fd.get("file");
      if (file instanceof File && file.size > 0) {
        if (file.size > 6 * 1024 * 1024) return bad("File is too large (max 6 MB).");
        const fileId = randomUUID();
        const data = Buffer.from(await file.arrayBuffer());
        await c.files.insertOne({ _id: fileId, kind: "delivery", name: file.name.slice(0, 120), mime: sniffMime(data) ?? "application/octet-stream", data: new Binary(data), ownerId: o.userId, createdAt: new Date() });
        set.deliveryFileId = fileId;
        set.deliveryFileName = file.name.slice(0, 120);
        attachments.push({ filename: file.name, content: data, contentType: sniffMime(data) ?? undefined });
      }
      await c.orders.updateOne({ _id: o._id }, { $set: set });
      await c.orderEvents.insertOne({ _id: new ObjectId(), orderId: hex(o._id), status: "completed", title: "Process done — your service is complete", note: deliveryNote, createdAt: new Date() });
      const fresh: Order = { ...o, ...set } as Order;
      if (o.email) later(() => sendMail({ to: o.email!, ...statusCustomer(fresh, "completed", trackUrl(o)), attachments, kind: "customer_notice", orderId: hex(o._id) }));
      const refLines = await referral(fresh);
      audit(o, "Order COMPLETED", [`Delivery: ${deliveryNote}`, ...refLines]);
      return ok("Order marked as completed. The customer now sees \"Process done\".");
    }

    // ================= USERS =================
    case "user_status": {
      const u = await loadUser();
      const status = str(fd, "status", 20) as UserStatus;
      if (!u) return bad("User not found.", 404);
      if (!STATUSES.includes(status)) return bad("Invalid status.");
      await c.users.updateOne({ _id: u._id }, { $set: { status } });
      await logActivity(hex(u._id), "admin_status", `${u.status ?? "active"} → ${status}`, req);
      later(() => notifyAdmin({ title: `User status changed — ${u.name}`, lines: [`User: ${u.name} (${u.email})`, `New status: ${status.toUpperCase()}`], link: `${origin}/admin/users/${hex(u._id)}` }));
      return ok(`${u.name} is now ${status.toUpperCase()}.${status !== "active" ? " They are logged out and cannot log in." : ""}`);
    }
    case "user_delete": {
      const u = await loadUser();
      if (!u) return bad("User not found.", 404);
      const id = hex(u._id);
      await c.users.deleteOne({ _id: u._id });
      await c.activity.deleteMany({ userId: id });
      await c.passwordResets.deleteMany({ userId: id });
      later(() => notifyAdmin({ title: `User DELETED — ${u.name}`, lines: [`User: ${u.name} (${u.email})`, "Their orders were kept in the order list."] }));
      return ok(`${u.name} was deleted.`);
    }
    case "user_reveal": {
      const u = await loadUser();
      if (!u) return bad("User not found.", 404);
      await logActivity(hex(u._id), "admin_viewed_password", null, req);
      const current = u.vault ? await decryptPw(u.vault.current.enc) : null;
      const history = await Promise.all(
        (u.vault?.history ?? []).map(async (h) => ({ password: await decryptPw(h.enc), setAt: h.at, retiredAt: h.retiredAt, how: h.how })),
      );
      return ok("ok", {
        current: u.vault ? { password: current, setAt: u.vault.current.at, how: u.vault.current.how } : null,
        history: history.reverse(),
      });
    }
    case "user_set_password": {
      const u = await loadUser();
      if (!u) return bad("User not found.", 404);
      const pw = String(fd.get("password") ?? "");
      const weak = checkPasswordStrength(pw);
      if (weak) return bad(weak);
      await c.users.updateOne({ _id: u._id }, { $set: { passwordHash: hashPassword(pw), vault: await nextVault(u, pw, "set by admin") }, $inc: { sv: 1 } });
      await logActivity(hex(u._id), "admin_password_set", null, req);
      later(() => sendMail({ to: u.email, ...passwordChangedNotice(u.name, "set by our support team"), kind: "customer_notice" }));
      later(() => notifyAdmin({ title: `Admin set a new password — ${u.name}`, lines: [`User: ${u.name} (${u.email})`], link: `${origin}/admin/users/${hex(u._id)}` }));
      return ok("New password saved. The user was logged out everywhere.", { reset: true });
    }
    case "reg_approval": {
      const on = fd.get("on") === "1";
      await setSetting("require_approval", on ? "1" : "0");
      return ok(on ? "New registrations now wait for your approval (status: Pending)." : "New registrations are active immediately.");
    }

    // ================= REFERRAL PAYOUT =================
    case "payout_add": {
      const user = await loadUser();
      if (!user) return bad("User not found.", 404);
      const amount = Math.round(Number(fd.get("amount")));
      const note = str(fd, "note", 300) || null;
      if (!Number.isFinite(amount) || amount <= 0) return bad("Enter a valid amount.");
      const { balance } = await balanceFor(hex(user._id));
      if (amount > balance) return bad(`Amount is more than the balance. Available: ${formatPKR(balance)}`);
      await c.payouts.insertOne({ _id: new ObjectId(), userId: hex(user._id), amount, note, createdAt: new Date() });
      const left = balance - amount;
      later(() => sendMail({ to: user.email, ...payoutSent(user.name, amount, note, left, `${origin}/account`), kind: "customer_notice" }));
      later(() =>
        notifyAdmin({
          title: `Referral payout recorded — ${user.name} (${formatPKR(amount)})`,
          lines: [`User: ${user.name} (${user.referralCode})`, `Paid: ${formatPKR(amount)}`, `Remaining balance: ${formatPKR(left)}`, ...(note ? [`Note: ${note}`] : [])],
          link: `${origin}/admin/users/${hex(user._id)}`,
        }),
      );
      return ok(`Payout of ${formatPKR(amount)} recorded. Remaining balance: ${formatPKR(left)}`, { reset: true });
    }

    // ================= EMAIL =================
    case "send_mail": {
      const to = str(fd, "to", 200);
      const subject = str(fd, "subject", 200);
      const body = str(fd, "body", 5000);
      if (!EMAIL_RE.test(to) || !subject || !body) return bad("Enter a valid email, subject and message.");
      const attachments: MailAttachment[] = [];
      const file = fd.get("file");
      if (file instanceof File && file.size > 0 && file.size <= 10 * 1024 * 1024)
        attachments.push({ filename: file.name, content: Buffer.from(await file.arrayBuffer()), contentType: file.type || undefined });
      const r = await sendMail({ to, ...manualMessage(subject, body), replyTo: ADMIN_EMAIL, attachments, kind: "manual", orderId: str(fd, "orderId", 30) || null });
      return r.ok ? ok("Email sent ✓") : bad(`Email could not be sent: ${r.error}`);
    }
    case "test_mail": {
      const m = manualMessage("Test email", "This is a test email. If you can read this, notifications are working ✅");
      const r = await sendMail({ to: ADMIN_EMAIL, ...m, kind: "test" });
      return r.ok ? ok(`Test email sent to ${ADMIN_EMAIL} ✓ (check inbox / spam)`) : bad(`Test failed: ${r.error}`);
    }
    case "smtp_save": {
      const pass = str(fd, "pass", 100).replace(/\s+/g, "");
      if (pass.length < 8) return bad("Enter the App Password correctly (16 letters).");
      await setSetting("smtp_pass", pass);
      const r = await sendMail({ to: ADMIN_EMAIL, ...manualMessage("Email connected ✅", "Your Gmail App Password was saved. All notifications and customer emails now go out from this Gmail."), kind: "test" });
      if (!r.ok) {
        await deleteSetting("smtp_pass");
        return bad("Gmail did not accept the password. Turn on 2-Step Verification and create a new App Password.");
      }
      return ok("Gmail connected ✓ — a test email was sent.");
    }
    case "smtp_remove":
      await deleteSetting("smtp_pass");
      return ok("Saved Gmail password removed.");

    // ================= WHATSAPP =================
    case "wa_save": {
      const phone = str(fd, "phone", 20).replace(/\D/g, "");
      const key = str(fd, "key", 60);
      if (phone.length < 10 || !key) return bad("Enter both the WhatsApp number (92...) and the CallMeBot API key.");
      await setSetting("wa_phone", phone);
      await setSetting("wa_key", key);
      const r = await sendWhatsApp("✅ I Series Digital Services — WhatsApp notifications connected!");
      return r.ok ? ok("WhatsApp connected ✓ — a test message was sent.") : bad(`Saved, but the test failed: ${r.error}`);
    }
    case "wa_test": {
      const r = await sendWhatsApp("🔔 Test notification — I Series Digital Services");
      return r.ok ? ok("WhatsApp test message sent ✓") : bad(r.skipped ? "Connect WhatsApp first." : `Failed: ${r.error}`);
    }
    case "wa_remove":
      await deleteSetting("wa_key");
      await deleteSetting("wa_phone");
      return ok("WhatsApp notifications turned off.");

    // ================= INQUIRIES =================
    case "inquiry_status": {
      const status = str(fd, "status", 20);
      const _id = oid(str(fd, "id", 30));
      if (!_id || !["new", "contacted", "closed"].includes(status)) return bad("Invalid request.");
      await c.inquiries.updateOne({ _id }, { $set: { status } });
      return ok("Status updated.");
    }

    // ================= PAYMENT ACCOUNTS =================
    case "payment_save": {
      const id = oid(str(fd, "id", 30));
      const kind = str(fd, "kind", 20);
      if (!["easypaisa", "jazzcash", "bank"].includes(kind)) return bad("Invalid type.");
      const values = {
        kind,
        accountTitle: str(fd, "accountTitle", 120),
        accountNumber: str(fd, "accountNumber", 60),
        bankName: str(fd, "bankName", 120) || null,
        iban: str(fd, "iban", 60) || null,
        active: fd.get("active") === "on",
      };
      if (!values.accountTitle || !values.accountNumber) return bad("Account title and number are required.");
      if (id) await c.paymentMethods.updateOne({ _id: id }, { $set: values });
      else await c.paymentMethods.insertOne({ _id: new ObjectId(), ...values, createdAt: new Date() });
      return ok("Payment account saved ✓", { reset: !id });
    }
    case "payment_delete": {
      const id = oid(str(fd, "id", 30));
      if (id) await c.paymentMethods.deleteOne({ _id: id });
      return ok("Account deleted.");
    }
  }
  return bad(`Unknown action: ${action}`);
}

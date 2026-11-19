import { NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
<<<<<<< HEAD
import {
  ADMIN_COOKIE,
  checkAdminPasswordRules,
  createAdminUser,
  currentAdmin,
  logAdmin,
  normEmail,
  revokeAdminSession,
  revokeAdminSessionsFor,
} from "@/backend/adminAuth";
import { hashPassword as hashAdminPw, verifyPassword as verifyAdminPw } from "@/backend/auth";
import { logActivity } from "@/backend/activity";
import { checkPasswordStrength, hashPassword } from "@/backend/auth";
import { adminEmail, baseUrl, deleteSetting, getSetting, sendMail, setSetting, type MailAttachment } from "@/backend/mail";
import { deleteService, getAllServices, getFaqs, moveService, resetServices, saveFaqs, saveService, saveSite } from "@/backend/config";
import { hashPassword as hashPw, verifyPassword as verifyPw } from "@/backend/auth";
import { DOC_KEYS, type DocKey, type DocReq, type Faq, type Service } from "@/shared/site";
=======
import { ADMIN_COOKIE, isAdmin, revokeAdminSession } from "@/backend/admin";
import { logActivity } from "@/backend/activity";
import { checkPasswordStrength, hashPassword } from "@/backend/auth";
import { ADMIN_EMAIL, baseUrl, deleteSetting, sendMail, setSetting, type MailAttachment } from "@/backend/mail";
>>>>>>> origin/main
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

<<<<<<< HEAD
  const me = await currentAdmin();
  if (!me) return bad("Your session has ended. Please log in again.", 401);
  const meId = hex(me._id);
=======
  if (!(await isAdmin())) return bad("Your session has ended. Please log in again.", 401);
>>>>>>> origin/main
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
<<<<<<< HEAD
    later(async () =>
      sendMail({
        to: referrer.email,
        ...(await commissionEarned(referrer.name, created.amount, created.referredName, created.orderNo, balance, `${origin}/account`)),
=======
    later(() =>
      sendMail({
        to: referrer.email,
        ...commissionEarned(referrer.name, created.amount, created.referredName, created.orderNo, balance, `${origin}/account`),
>>>>>>> origin/main
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
<<<<<<< HEAD
      if (o.email) later(async () => sendMail({ to: o.email!, ...(await processingCustomer(fresh, trackUrl(o))), kind: "customer_notice", orderId: hex(o._id) }));
=======
      if (o.email) later(() => sendMail({ to: o.email!, ...processingCustomer(fresh, trackUrl(o)), kind: "customer_notice", orderId: hex(o._id) }));
>>>>>>> origin/main
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
<<<<<<< HEAD
      if (o.email) later(async () => sendMail({ to: o.email!, ...(await statusCustomer(fresh, "rejected", trackUrl(o))), kind: "customer_notice", orderId: hex(o._id) }));
=======
      if (o.email) later(() => sendMail({ to: o.email!, ...statusCustomer(fresh, "rejected", trackUrl(o)), kind: "customer_notice", orderId: hex(o._id) }));
>>>>>>> origin/main
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
<<<<<<< HEAD
      if (fd.get("emailCustomer") === "on" && o.email) later(async () => sendMail({ to: o.email!, ...(await updateCustomer(o, note, trackUrl(o))), kind: "customer_notice", orderId: hex(o._id) }));
=======
      if (fd.get("emailCustomer") === "on" && o.email) later(() => sendMail({ to: o.email!, ...updateCustomer(o, note, trackUrl(o)), kind: "customer_notice", orderId: hex(o._id) }));
>>>>>>> origin/main
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
<<<<<<< HEAD
      if (o.email) later(async () => sendMail({ to: o.email!, ...(await statusCustomer(fresh, "completed", trackUrl(o))), attachments, kind: "customer_notice", orderId: hex(o._id) }));
=======
      if (o.email) later(() => sendMail({ to: o.email!, ...statusCustomer(fresh, "completed", trackUrl(o)), attachments, kind: "customer_notice", orderId: hex(o._id) }));
>>>>>>> origin/main
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
<<<<<<< HEAD
      later(async () => notifyAdmin({ title: `User status changed — ${u.name}`, lines: [`User: ${u.name} (${u.email})`, `New status: ${status.toUpperCase()}`], link: `${origin}/admin/users/${hex(u._id)}` }));
=======
      later(() => notifyAdmin({ title: `User status changed — ${u.name}`, lines: [`User: ${u.name} (${u.email})`, `New status: ${status.toUpperCase()}`], link: `${origin}/admin/users/${hex(u._id)}` }));
>>>>>>> origin/main
      return ok(`${u.name} is now ${status.toUpperCase()}.${status !== "active" ? " They are logged out and cannot log in." : ""}`);
    }
    case "user_delete": {
      const u = await loadUser();
      if (!u) return bad("User not found.", 404);
      const id = hex(u._id);
      await c.users.deleteOne({ _id: u._id });
      await c.activity.deleteMany({ userId: id });
      await c.passwordResets.deleteMany({ userId: id });
<<<<<<< HEAD
      later(async () => notifyAdmin({ title: `User DELETED — ${u.name}`, lines: [`User: ${u.name} (${u.email})`, "Their orders were kept in the order list."] }));
=======
      later(() => notifyAdmin({ title: `User DELETED — ${u.name}`, lines: [`User: ${u.name} (${u.email})`, "Their orders were kept in the order list."] }));
>>>>>>> origin/main
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
<<<<<<< HEAD
      later(async () => sendMail({ to: u.email, ...(await passwordChangedNotice(u.name, "set by our support team")), kind: "customer_notice" }));
      later(async () => notifyAdmin({ title: `Admin set a new password — ${u.name}`, lines: [`User: ${u.name} (${u.email})`], link: `${origin}/admin/users/${hex(u._id)}` }));
=======
      later(() => sendMail({ to: u.email, ...passwordChangedNotice(u.name, "set by our support team"), kind: "customer_notice" }));
      later(() => notifyAdmin({ title: `Admin set a new password — ${u.name}`, lines: [`User: ${u.name} (${u.email})`], link: `${origin}/admin/users/${hex(u._id)}` }));
>>>>>>> origin/main
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
<<<<<<< HEAD
      later(async () => sendMail({ to: user.email, ...(await payoutSent(user.name, amount, note, left, `${origin}/account`)), kind: "customer_notice" }));
      later(async () =>
=======
      later(() => sendMail({ to: user.email, ...payoutSent(user.name, amount, note, left, `${origin}/account`), kind: "customer_notice" }));
      later(() =>
>>>>>>> origin/main
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
<<<<<<< HEAD
      const r = await sendMail({ to, ...(await manualMessage(subject, body)), replyTo: await adminEmail(), attachments, kind: "manual", orderId: str(fd, "orderId", 30) || null });
      return r.ok ? ok("Email sent ✓") : bad(`Email could not be sent: ${r.error}`);
    }
    case "test_mail": {
      const m = await manualMessage("Test email", "This is a test email. If you can read this, notifications are working ✅");
      const admin = await adminEmail();
      const r = await sendMail({ to: admin, ...m, kind: "test" });
      return r.ok ? ok(`Test email sent to ${admin} ✓ (check inbox / spam)`) : bad(`Test failed: ${r.error}`);
=======
      const r = await sendMail({ to, ...manualMessage(subject, body), replyTo: ADMIN_EMAIL, attachments, kind: "manual", orderId: str(fd, "orderId", 30) || null });
      return r.ok ? ok("Email sent ✓") : bad(`Email could not be sent: ${r.error}`);
    }
    case "test_mail": {
      const m = manualMessage("Test email", "This is a test email. If you can read this, notifications are working ✅");
      const r = await sendMail({ to: ADMIN_EMAIL, ...m, kind: "test" });
      return r.ok ? ok(`Test email sent to ${ADMIN_EMAIL} ✓ (check inbox / spam)`) : bad(`Test failed: ${r.error}`);
>>>>>>> origin/main
    }
    case "smtp_save": {
      const pass = str(fd, "pass", 100).replace(/\s+/g, "");
      if (pass.length < 8) return bad("Enter the App Password correctly (16 letters).");
      await setSetting("smtp_pass", pass);
<<<<<<< HEAD
      const r = await sendMail({ to: await adminEmail(), ...(await manualMessage("Email connected ✅", "Your Gmail App Password was saved. All notifications and customer emails now go out from this Gmail.")), kind: "test" });
=======
      const r = await sendMail({ to: ADMIN_EMAIL, ...manualMessage("Email connected ✅", "Your Gmail App Password was saved. All notifications and customer emails now go out from this Gmail."), kind: "test" });
>>>>>>> origin/main
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

<<<<<<< HEAD

    // ================= DELETE DATA =================
    case "order_delete": {
      const o = await loadOrder();
      if (!o) return bad("Order not found.", 404);
      const oid2 = hex(o._id);
      const fileIds = [o.slipFileId, o.deliveryFileId, ...o.documents.map((d) => d.fileId)].filter(Boolean) as string[];
      await c.files.deleteMany({ _id: { $in: fileIds } });
      await c.orderEvents.deleteMany({ orderId: oid2 });
      await c.commissions.deleteMany({ orderId: oid2 });
      await c.emailLogs.deleteMany({ orderId: oid2 });
      await c.orders.deleteOne({ _id: o._id });
      later(async () =>
        notifyAdmin({
          title: `Order DELETED — ${o.orderNo} (${o.name})`,
          lines: [`Order: ${o.orderNo}`, `Customer: ${o.name}`, `Total: ${formatPKR(o.total)}`, `${fileIds.length} uploaded files were deleted too.`],
        }),
      );
      return ok(`Order ${o.orderNo} and its ${fileIds.length} files were deleted.`);
    }
    case "inquiry_delete": {
      const _id = oid(str(fd, "id", 30));
      if (!_id) return bad("Invalid request.");
      await c.inquiries.deleteOne({ _id });
      return ok("Inquiry deleted.");
    }
    case "logs_clear": {
      const days = Number(fd.get("days"));
      if (days > 0) {
        const before = new Date(Date.now() - days * 86_400_000);
        const r = await c.emailLogs.deleteMany({ createdAt: { $lt: before } });
        return ok(`${r.deletedCount} notifications older than ${days} days were deleted.`);
      }
      const r = await c.emailLogs.deleteMany({});
      return ok(`All ${r.deletedCount} notification log entries were deleted.`);
    }

    // ================= WEBSITE SETTINGS =================
    case "site_save": {
      const phones: { display: string; intl: string }[] = [];
      for (let i = 0; i < 6; i++) {
        const display = str(fd, `phone${i}`, 40);
        if (!display) continue;
        const intl = (str(fd, `phoneIntl${i}`, 20) || display).replace(/\D/g, "");
        if (intl.length >= 10) phones.push({ display, intl });
      }
      const name = str(fd, "name", 80);
      const email = str(fd, "email", 160);
      if (!name) return bad("The website name is required.");
      if (!EMAIL_RE.test(email)) return bad("Enter a valid contact email.");
      const rate = Number(fd.get("referralRate"));
      await saveSite({
        name,
        short: str(fd, "short", 40) || name,
        tagline: str(fd, "tagline", 160),
        email,
        address: str(fd, "address", 200),
        whatsapp: str(fd, "whatsapp", 20).replace(/\D/g, "") || phones[0]?.intl || "",
        phones,
        referralRate: Number.isFinite(rate) ? Math.min(90, Math.max(0, rate)) / 100 : 0.1,
        heroTitle: str(fd, "heroTitle", 80),
        heroHighlight: str(fd, "heroHighlight", 80),
        heroUrdu: str(fd, "heroUrdu", 160),
        heroText: str(fd, "heroText", 500),
        disclaimer: str(fd, "disclaimer", 600),
      });
      return ok("Website settings saved ✓ — the site is updated.");
    }
    case "logo_upload": {
      const which = str(fd, "which", 10); // light | dark
      if (which !== "light" && which !== "dark") return bad("Invalid logo type.");
      const file = fd.get("file");
      if (!(file instanceof File) || file.size === 0) return bad("Choose a logo image first.");
      if (file.size > 2 * 1024 * 1024) return bad("Logo must be under 2 MB.");
      const data = Buffer.from(await file.arrayBuffer());
      const sniffed = sniffMime(data);
      const isSvg = data.subarray(0, 400).toString("utf8").trim().toLowerCase().startsWith("<svg") || file.name.toLowerCase().endsWith(".svg");
      if (!sniffed?.startsWith("image/") && !isSvg) return bad("Logo must be a PNG, JPG, WEBP or SVG image.");
      await c.files.updateOne(
        { _id: `logo-${which}` },
        { $set: { kind: "branding", name: file.name.slice(0, 120), mime: isSvg ? "image/svg+xml" : sniffed!, data: new Binary(data), ownerId: null, createdAt: new Date() } },
        { upsert: true },
      );
      await saveSite({ logoVersion: Date.now().toString(36), [which === "light" ? "hasLogoLight" : "hasLogoDark"]: true });
      return ok(`${which === "light" ? "Main" : "Dark-background"} logo updated ✓`);
    }
    case "logo_reset": {
      const which = str(fd, "which", 10);
      if (which !== "light" && which !== "dark") return bad("Invalid logo type.");
      await c.files.deleteOne({ _id: `logo-${which}` });
      await saveSite({ logoVersion: Date.now().toString(36), [which === "light" ? "hasLogoLight" : "hasLogoDark"]: false });
      return ok("Logo reset to the built-in one.");
    }

    // ================= SERVICES =================
    case "service_save": {
      const original = str(fd, "slug", 60);
      const slug = (str(fd, "newSlug", 60) || original)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const title = str(fd, "title", 120);
      if (!slug) return bad("A web address (slug) is required.");
      if (!title) return bad("A service title is required.");
      const all = await getAllServices();
      if (slug !== original && all.some((s) => s.slug === slug)) return bad("Another service already uses that web address.");
      const priceRaw = str(fd, "price", 20);
      const price = priceRaw === "" ? null : Math.max(0, Math.round(Number(priceRaw)));
      if (price !== null && !Number.isFinite(price)) return bad("Enter a valid price, or leave it empty for 'on work basis'.");
      const docs: DocReq[] = [];
      for (const d of DOC_KEYS) {
        const mode = str(fd, `doc_${d.key}`, 10); // off | optional | required
        if (mode === "optional" || mode === "required")
          docs.push({ key: d.key as DocKey, label: str(fd, `doclabel_${d.key}`, 80) || d.label, required: mode === "required" });
      }
      const service: Service = {
        slug,
        title,
        urdu: str(fd, "urdu", 120),
        desc: str(fd, "desc", 600),
        points: str(fd, "points", 600).split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8),
        icon: str(fd, "icon", 40) || "FileCheck2",
        price,
        docs,
        active: fd.get("active") === "on",
      };
      await saveService(original, service);
      return ok(`Service "${title}" saved ✓`, { slug });
    }
    case "service_delete": {
      const slug = str(fd, "slug", 60);
      const all = await getAllServices();
      if (all.length <= 1) return bad("You cannot delete the last service.");
      await deleteService(slug);
      return ok("Service deleted. Existing orders for it are not affected.");
    }
    case "service_move": {
      await moveService(str(fd, "slug", 60), str(fd, "dir", 6) === "up" ? "up" : "down");
      return ok("Order updated.");
    }
    case "services_reset": {
      await resetServices();
      return ok("Services restored to the built-in list.");
    }

    // ================= FAQs =================
    case "faqs_save": {
      const list: Faq[] = [];
      for (let i = 0; i < 40; i++) {
        const q = str(fd, `q${i}`, 200);
        const a = str(fd, `a${i}`, 1500);
        if (q && a) list.push({ q, a });
      }
      await saveFaqs(list);
      return ok(`${list.length} FAQs saved ✓`);
    }

    // ================= ADMIN ACCOUNTS & SECURITY =================
    case "admin_password": {
      const current = String(fd.get("current") ?? "");
      const next = String(fd.get("next") ?? "");
      const confirm = String(fd.get("confirm") ?? "");
      if (!verifyAdminPw(current, me.passwordHash)) return bad("Your current password is incorrect.");
      const weak = checkAdminPasswordRules(next);
      if (weak) return bad(weak);
      if (next !== confirm) return bad("The two new passwords do not match.");
      if (verifyAdminPw(next, me.passwordHash)) return bad("Choose a password you have not used before.");
      await c.adminUsers.updateOne({ _id: me._id }, { $set: { passwordHash: hashAdminPw(next) } });
      await revokeAdminSessionsFor(meId); // sign out every device, including this one
      await logAdmin(meId, me.name, "password_changed", "Changed their own password", req);
      later(async () =>
        notifyAdmin({ title: `Admin password changed — ${me.name}`, lines: [`Account: ${me.email}`, "If this was not you, act immediately."] }),
      );
      return ok("Password changed ✓ Please sign in again.", { logout: true });
    }
    case "admin_profile": {
      const name = str(fd, "name", 80);
      const email = normEmail(str(fd, "email", 160));
      if (name.length < 2) return bad("Enter your full name.");
      if (!EMAIL_RE.test(email)) return bad("Enter a valid email address.");
      const clash = await c.adminUsers.findOne({ email, _id: { $ne: me._id } });
      if (clash) return bad("Another admin already uses that email.");
      await c.adminUsers.updateOne({ _id: me._id }, { $set: { name, email } });
      await logAdmin(meId, name, "profile_updated", `Name/email updated (${email})`, req);
      return ok("Your admin profile was saved ✓");
    }
    case "admin_add": {
      if (me.role !== "owner") return bad("Only the owner account can add admins.", 403);
      const created = await createAdminUser({
        name: str(fd, "name", 80),
        email: str(fd, "email", 160),
        password: String(fd.get("password") ?? ""),
        role: "admin",
      });
      if (!created.ok) return bad(created.error);
      await logAdmin(meId, me.name, "admin_created", `Added admin ${str(fd, "email", 160)}`, req);
      later(async () =>
        notifyAdmin({ title: "New admin account created", lines: [`Created by: ${me.name}`, `New admin: ${str(fd, "name", 80)} (${str(fd, "email", 160)})`] }),
      );
      return ok("Admin account created ✓", { reset: true });
    }
    case "admin_toggle": {
      if (me.role !== "owner") return bad("Only the owner account can change other admins.", 403);
      const _id = oid(str(fd, "id", 30));
      if (!_id) return bad("Invalid request.");
      if (hex(_id) === meId) return bad("You cannot disable your own account.");
      const target = await c.adminUsers.findOne({ _id });
      if (!target) return bad("Admin not found.", 404);
      const active = !target.active;
      await c.adminUsers.updateOne({ _id }, { $set: { active } });
      if (!active) await revokeAdminSessionsFor(hex(_id));
      await logAdmin(meId, me.name, "admin_toggled", `${target.email} ${active ? "enabled" : "disabled"}`, req);
      return ok(`${target.name} is now ${active ? "enabled" : "disabled"}.`);
    }
    case "admin_reset_password": {
      if (me.role !== "owner") return bad("Only the owner account can reset admin passwords.", 403);
      const _id = oid(str(fd, "id", 30));
      const pw = String(fd.get("password") ?? "");
      if (!_id) return bad("Invalid request.");
      const weak = checkAdminPasswordRules(pw);
      if (weak) return bad(weak);
      const target = await c.adminUsers.findOne({ _id });
      if (!target) return bad("Admin not found.", 404);
      await c.adminUsers.updateOne({ _id }, { $set: { passwordHash: hashAdminPw(pw) } });
      await revokeAdminSessionsFor(hex(_id));
      await logAdmin(meId, me.name, "admin_password_reset", `Reset password for ${target.email}`, req);
      return ok(`New password set for ${target.name}. They were signed out everywhere.`, { reset: true });
    }
    case "admin_delete": {
      if (me.role !== "owner") return bad("Only the owner account can delete admins.", 403);
      const _id = oid(str(fd, "id", 30));
      if (!_id) return bad("Invalid request.");
      if (hex(_id) === meId) return bad("You cannot delete your own account.");
      const target = await c.adminUsers.findOne({ _id });
      if (!target) return bad("Admin not found.", 404);
      if (target.role === "owner" && (await c.adminUsers.countDocuments({ role: "owner" })) <= 1)
        return bad("You cannot delete the last owner account.");
      await c.adminUsers.deleteOne({ _id });
      await revokeAdminSessionsFor(hex(_id));
      await logAdmin(meId, me.name, "admin_deleted", `Deleted admin ${target.email}`, req);
      return ok(`${target.name} was removed.`);
    }
    case "admin_signout_all": {
      await revokeAdminSessionsFor();
      await logAdmin(meId, me.name, "sessions_cleared", "Signed out all admin devices", req);
      return ok("Every admin device was signed out.", { logout: true });
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
      later(async () => sendMail({ to: user.email, ...(await payoutSent(user.name, amount, note, left, `${origin}/account`)), kind: "customer_notice" }));
      later(async () =>
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
      const r = await sendMail({ to, ...(await manualMessage(subject, body)), replyTo: await adminEmail(), attachments, kind: "manual", orderId: str(fd, "orderId", 30) || null });
      return r.ok ? ok("Email sent ✓") : bad(`Email could not be sent: ${r.error}`);
    }
    case "test_mail": {
      const m = await manualMessage("Test email", "This is a test email. If you can read this, notifications are working ✅");
      const admin = await adminEmail();
      const r = await sendMail({ to: admin, ...m, kind: "test" });
      return r.ok ? ok(`Test email sent to ${admin} ✓ (check inbox / spam)`) : bad(`Test failed: ${r.error}`);
    }
    case "smtp_save": {
      const pass = str(fd, "pass", 100).replace(/\s+/g, "");
      if (pass.length < 8) return bad("Enter the App Password correctly (16 letters).");
      await setSetting("smtp_pass", pass);
      const r = await sendMail({ to: await adminEmail(), ...(await manualMessage("Email connected ✅", "Your Gmail App Password was saved. All notifications and customer emails now go out from this Gmail.")), kind: "test" });
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


    // ================= DELETE DATA =================
    case "order_delete": {
      const o = await loadOrder();
      if (!o) return bad("Order not found.", 404);
      const oid2 = hex(o._id);
      const fileIds = [o.slipFileId, o.deliveryFileId, ...o.documents.map((d) => d.fileId)].filter(Boolean) as string[];
      await c.files.deleteMany({ _id: { $in: fileIds } });
      await c.orderEvents.deleteMany({ orderId: oid2 });
      await c.commissions.deleteMany({ orderId: oid2 });
      await c.emailLogs.deleteMany({ orderId: oid2 });
      await c.orders.deleteOne({ _id: o._id });
      later(async () =>
        notifyAdmin({
          title: `Order DELETED — ${o.orderNo} (${o.name})`,
          lines: [`Order: ${o.orderNo}`, `Customer: ${o.name}`, `Total: ${formatPKR(o.total)}`, `${fileIds.length} uploaded files were deleted too.`],
        }),
      );
      return ok(`Order ${o.orderNo} and its ${fileIds.length} files were deleted.`);
    }
    case "inquiry_delete": {
      const _id = oid(str(fd, "id", 30));
      if (!_id) return bad("Invalid request.");
      await c.inquiries.deleteOne({ _id });
      return ok("Inquiry deleted.");
    }
    case "logs_clear": {
      const days = Number(fd.get("days"));
      if (days > 0) {
        const before = new Date(Date.now() - days * 86_400_000);
        const r = await c.emailLogs.deleteMany({ createdAt: { $lt: before } });
        return ok(`${r.deletedCount} notifications older than ${days} days were deleted.`);
      }
      const r = await c.emailLogs.deleteMany({});
      return ok(`All ${r.deletedCount} notification log entries were deleted.`);
    }

    // ================= WEBSITE SETTINGS =================
    case "site_save": {
      const phones: { display: string; intl: string }[] = [];
      for (let i = 0; i < 6; i++) {
        const display = str(fd, `phone${i}`, 40);
        if (!display) continue;
        const intl = (str(fd, `phoneIntl${i}`, 20) || display).replace(/\D/g, "");
        if (intl.length >= 10) phones.push({ display, intl });
      }
      const name = str(fd, "name", 80);
      const email = str(fd, "email", 160);
      if (!name) return bad("The website name is required.");
      if (!EMAIL_RE.test(email)) return bad("Enter a valid contact email.");
      const rate = Number(fd.get("referralRate"));
      await saveSite({
        name,
        short: str(fd, "short", 40) || name,
        tagline: str(fd, "tagline", 160),
        email,
        address: str(fd, "address", 200),
        whatsapp: str(fd, "whatsapp", 20).replace(/\D/g, "") || phones[0]?.intl || "",
        phones,
        referralRate: Number.isFinite(rate) ? Math.min(90, Math.max(0, rate)) / 100 : 0.1,
        heroTitle: str(fd, "heroTitle", 80),
        heroHighlight: str(fd, "heroHighlight", 80),
        heroUrdu: str(fd, "heroUrdu", 160),
        heroText: str(fd, "heroText", 500),
        disclaimer: str(fd, "disclaimer", 600),
      });
      return ok("Website settings saved ✓ — the site is updated.");
    }
    case "logo_upload": {
      const which = str(fd, "which", 10); // light | dark
      if (which !== "light" && which !== "dark") return bad("Invalid logo type.");
      const file = fd.get("file");
      if (!(file instanceof File) || file.size === 0) return bad("Choose a logo image first.");
      if (file.size > 2 * 1024 * 1024) return bad("Logo must be under 2 MB.");
      const data = Buffer.from(await file.arrayBuffer());
      const sniffed = sniffMime(data);
      const isSvg = data.subarray(0, 400).toString("utf8").trim().toLowerCase().startsWith("<svg") || file.name.toLowerCase().endsWith(".svg");
      if (!sniffed?.startsWith("image/") && !isSvg) return bad("Logo must be a PNG, JPG, WEBP or SVG image.");
      await c.files.updateOne(
        { _id: `logo-${which}` },
        { $set: { kind: "branding", name: file.name.slice(0, 120), mime: isSvg ? "image/svg+xml" : sniffed!, data: new Binary(data), ownerId: null, createdAt: new Date() } },
        { upsert: true },
      );
      await saveSite({ logoVersion: Date.now().toString(36), [which === "light" ? "hasLogoLight" : "hasLogoDark"]: true });
      return ok(`${which === "light" ? "Main" : "Dark-background"} logo updated ✓`);
    }
    case "logo_reset": {
      const which = str(fd, "which", 10);
      if (which !== "light" && which !== "dark") return bad("Invalid logo type.");
      await c.files.deleteOne({ _id: `logo-${which}` });
      await saveSite({ logoVersion: Date.now().toString(36), [which === "light" ? "hasLogoLight" : "hasLogoDark"]: false });
      return ok("Logo reset to the built-in one.");
    }

    // ================= SERVICES =================
    case "service_save": {
      const original = str(fd, "slug", 60);
      const slug = (str(fd, "newSlug", 60) || original)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const title = str(fd, "title", 120);
      if (!slug) return bad("A web address (slug) is required.");
      if (!title) return bad("A service title is required.");
      const all = await getAllServices();
      if (slug !== original && all.some((s) => s.slug === slug)) return bad("Another service already uses that web address.");
      const priceRaw = str(fd, "price", 20);
      const price = priceRaw === "" ? null : Math.max(0, Math.round(Number(priceRaw)));
      if (price !== null && !Number.isFinite(price)) return bad("Enter a valid price, or leave it empty for 'on work basis'.");
      const docs: DocReq[] = [];
      for (const d of DOC_KEYS) {
        const mode = str(fd, `doc_${d.key}`, 10); // off | optional | required
        if (mode === "optional" || mode === "required")
          docs.push({ key: d.key as DocKey, label: str(fd, `doclabel_${d.key}`, 80) || d.label, required: mode === "required" });
      }
      const service: Service = {
        slug,
        title,
        urdu: str(fd, "urdu", 120),
        desc: str(fd, "desc", 600),
        points: str(fd, "points", 600).split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8),
        icon: str(fd, "icon", 40) || "FileCheck2",
        price,
        docs,
        active: fd.get("active") === "on",
      };
      await saveService(original, service);
      return ok(`Service "${title}" saved ✓`, { slug });
    }
    case "service_delete": {
      const slug = str(fd, "slug", 60);
      const all = await getAllServices();
      if (all.length <= 1) return bad("You cannot delete the last service.");
      await deleteService(slug);
      return ok("Service deleted. Existing orders for it are not affected.");
    }
    case "service_move": {
      await moveService(str(fd, "slug", 60), str(fd, "dir", 6) === "up" ? "up" : "down");
      return ok("Order updated.");
    }
    case "services_reset": {
      await resetServices();
      return ok("Services restored to the built-in list.");
    }

    // ================= FAQs =================
    case "faqs_save": {
      const list: Faq[] = [];
      for (let i = 0; i < 40; i++) {
        const q = str(fd, `q${i}`, 200);
        const a = str(fd, `a${i}`, 1500);
        if (q && a) list.push({ q, a });
      }
      await saveFaqs(list);
      return ok(`${list.length} FAQs saved ✓`);
    }

    // ================= ADMIN PASSWORD =================
    case "admin_password": {
      const current = String(fd.get("current") ?? "");
      const next = String(fd.get("next") ?? "");
      const confirm = String(fd.get("confirm") ?? "");
      const stored = await getSetting("admin_password_hash");
      const envPw = process.env.ADMIN_PASSWORD || "1234";
      const okNow = stored ? verifyPw(current, stored) : current.trim() === envPw.trim();
      if (!okNow) return bad("Your current admin password is incorrect.");
      if (next.length < 8) return bad("The new password must be at least 8 characters.");
      if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return bad("The new password needs at least one letter and one number.");
      if (next !== confirm) return bad("The two new passwords do not match.");
      await setSetting("admin_password_hash", hashPw(next));
      await c.adminSessions.deleteMany({}); // log every admin device out
      later(async () => notifyAdmin({ title: "Admin password was changed", lines: ["The admin panel password was changed just now.", "If this was not you, contact your developer immediately."] }));
      return ok("Admin password changed ✓ You will be asked to log in again.", { logout: true });
    }

=======
>>>>>>> origin/main
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

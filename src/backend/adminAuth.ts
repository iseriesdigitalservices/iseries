import "server-only"; // backend only — never bundled into the browser
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { cols, hex, ObjectId, oid, type AdminUser } from "@/backend/mongo";
import { hashPassword, verifyPassword } from "@/backend/auth";
import { clientIp, safeEqual, sha256, userAgent } from "@/backend/security";

export const ADMIN_COOKIE = "po_admin";

const IDLE_MS = 60 * 60_000; // signed out after 60 minutes of no activity
const MAX_MS = 8 * 60 * 60_000; // a session never lives longer than 8 hours

/* ------------------------------------------------------------ accounts */

export const normEmail = (e: string) => e.trim().toLowerCase().slice(0, 160);

export async function adminCount() {
  try {
    const { adminUsers } = await cols();
    return await adminUsers.countDocuments();
  } catch {
    return -1; // database unreachable
  }
}

/** True while nobody has created an admin account yet (first-run setup). */
export async function needsSetup() {
  return (await adminCount()) === 0;
}

/** The one-time key that lets someone create the FIRST admin account. */
export function setupKeyMatches(key: string) {
  return safeEqual(key.trim(), (process.env.ADMIN_PASSWORD || "1234").trim());
}

export function checkAdminPasswordRules(pw: string): string | null {
  if (pw.length < 10) return "Admin password must be at least 10 characters.";
  if (pw.length > 200) return "That password is too long.";
  if (!/[a-z]/.test(pw)) return "Include at least one lowercase letter.";
  if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter.";
  if (!/\d/.test(pw)) return "Include at least one number.";
  if (/^(password|admin|12345|qwerty)/i.test(pw)) return "That password is too easy to guess.";
  return null;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role?: "owner" | "admin";
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { adminUsers } = await cols();
  const email = normEmail(input.email);
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) return { ok: false, error: "Enter the admin's full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  const weak = checkAdminPasswordRules(input.password);
  if (weak) return { ok: false, error: weak };
  if (await adminUsers.findOne({ email })) return { ok: false, error: "An admin with that email already exists." };

  const doc: AdminUser = {
    _id: new ObjectId(),
    name,
    email,
    passwordHash: hashPassword(input.password),
    role: input.role ?? "admin",
    active: true,
    createdAt: new Date(),
    lastLoginAt: null,
    lastLoginIp: null,
  };
  await adminUsers.insertOne(doc);
  return { ok: true, id: hex(doc._id) };
}

/** Verifies email + password. Returns the admin, or a reason it failed. */
export async function verifyAdminLogin(email: string, password: string): Promise<{ admin: AdminUser } | { error: string }> {
  const { adminUsers } = await cols();
  const admin = await adminUsers.findOne({ email: normEmail(email) });
  // same message either way, so nobody can discover which emails exist
  if (!admin || !verifyPassword(password, admin.passwordHash)) return { error: "Incorrect email or password." };
  if (!admin.active) return { error: "This admin account has been disabled." };
  return { admin };
}

/* ------------------------------------------------------------ sessions */

export async function createAdminSession(req: Request, adminId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const { adminSessions } = await cols();
  const now = Date.now();
  await adminSessions.insertOne({
    _id: sha256(token),
    adminId,
    createdAt: new Date(now),
    expireAt: new Date(now + IDLE_MS),
    ip: clientIp(req),
    ua: userAgent(req),
  });
  return token;
}

export async function revokeAdminSession(token: string | undefined | null) {
  if (!token) return;
  try {
    const { adminSessions } = await cols();
    await adminSessions.deleteOne({ _id: sha256(token) });
  } catch {}
}

/** Signs out every session belonging to one admin (or everybody when no id is given). */
export async function revokeAdminSessionsFor(adminId?: string) {
  const { adminSessions } = await cols();
  await adminSessions.deleteMany(adminId ? { adminId } : {});
}

/** The admin behind the current request, or null. Also refreshes the idle timer. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || token.length < 32) return null;
  try {
    const { adminSessions, adminUsers } = await cols();
    const s = await adminSessions.findOne({ _id: sha256(token) });
    const now = Date.now();
    if (!s || s.expireAt.getTime() < now || now - s.createdAt.getTime() > MAX_MS) {
      if (s) await adminSessions.deleteOne({ _id: s._id });
      return null;
    }
    const _id = oid(s.adminId);
    const admin = _id ? await adminUsers.findOne({ _id }) : null;
    if (!admin || !admin.active) {
      await adminSessions.deleteOne({ _id: s._id });
      return null;
    }
    await adminSessions.updateOne(
      { _id: s._id },
      { $set: { expireAt: new Date(Math.min(now + IDLE_MS, s.createdAt.getTime() + MAX_MS)) } },
    );
    return admin;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}

/* ------------------------------------------------------------ audit log */

export async function logAdmin(adminId: string | null, adminName: string, action: string, detail?: string | null, req?: Request) {
  try {
    const { adminActivity } = await cols();
    await adminActivity.insertOne({
      _id: new ObjectId(),
      adminId,
      adminName,
      action,
      detail: detail ?? null,
      ip: req ? clientIp(req) : null,
      ua: req ? userAgent(req) : null,
      at: new Date(),
    });
  } catch (e) {
    console.error("[admin-audit]", e);
  }
}

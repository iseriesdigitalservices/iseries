import "server-only"; // backend only — never bundled into the browser
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cols, hex, oid, type User } from "@/backend/mongo";
import { getAuthSecret } from "@/backend/secret";

export const USER_COOKIE = "po_user";
export const SESSION_SECONDS = 60 * 60 * 24 * 14;

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const a = Buffer.from(h, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Returns an error message, or null when the password is acceptable. */
export function checkPasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 100) return "Password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain at least one letter and one number.";
  return null;
}

const sign = async (p: string) => createHmac("sha256", await getAuthSecret()).update(p).digest("hex");

export async function sessionToken(userId: string, sv: number) {
  const p = `${userId}.${Date.now() + SESSION_SECONDS * 1000}.${sv}`;
  return `${p}.${await sign(p)}`;
}

async function readToken(t?: string | null): Promise<{ id: string; sv: number } | null> {
  if (!t) return null;
  const [id, exp, sv, sig] = t.split(".");
  if (!id || !exp || sv === undefined || !sig) return null;
  const expected = await sign(`${id}.${exp}.${sv}`);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  return { id, sv: Number(sv) };
}

/** The logged-in, ACTIVE user (or null). Deactivated / held / pending users and old sessions are rejected. */
export async function getCurrentUser(): Promise<User | null> {
  const parsed = await readToken((await cookies()).get(USER_COOKIE)?.value);
  const _id = oid(parsed?.id);
  if (!parsed || !_id) return null;
  try {
    const { users } = await cols();
    const u = await users.findOne({ _id });
    if (!u || (u.status ?? "active") !== "active" || (u.sv ?? 0) !== parsed.sv) return null;
    return u;
  } catch {
    return null;
  }
}

export const publicUser = (u: User) => ({
  id: hex(u._id),
  name: u.name,
  email: u.email,
  phone: u.phone,
  country: u.country,
  referralCode: u.referralCode,
  payoutAccount: u.payoutAccount,
});

export function safeNext(n: string | null | undefined, fallback = "/account") {
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") && !n.startsWith("/admin") ? n : fallback;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function randomCode(len = 6) {
  const bytes = randomBytes(len);
  return "IS" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

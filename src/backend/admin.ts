import "server-only"; // backend only — never bundled into the browser
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { cols, type PaymentMethod } from "@/backend/mongo";
import { clientIp, sha256, userAgent } from "@/backend/security";

export const ADMIN_COOKIE = "po_admin";
const IDLE_MS = 90 * 60_000; // auto logout after 90 minutes without activity
const MAX_MS = 12 * 60 * 60_000; // never longer than 12 hours

/** Creates a server-side admin session and returns the (random) cookie token. */
export async function createAdminSession(req: Request): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const { adminSessions } = await cols();
  const now = Date.now();
  await adminSessions.insertOne({ _id: sha256(token), createdAt: new Date(now), expireAt: new Date(now + IDLE_MS), ip: clientIp(req), ua: userAgent(req) });
  return token;
}

export async function revokeAdminSession(token: string | undefined | null) {
  if (!token) return;
  try {
    const { adminSessions } = await cols();
    await adminSessions.deleteOne({ _id: sha256(token) });
  } catch {}
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || token.length < 32) return false;
  try {
    const { adminSessions } = await cols();
    const s = await adminSessions.findOne({ _id: sha256(token) });
    const now = Date.now();
    if (!s || s.expireAt.getTime() < now || now - s.createdAt.getTime() > MAX_MS) {
      if (s) await adminSessions.deleteOne({ _id: s._id });
      return false;
    }
    await adminSessions.updateOne({ _id: s._id }, { $set: { expireAt: new Date(Math.min(now + IDLE_MS, s.createdAt.getTime() + MAX_MS)) } });
    return true;
  } catch {
    return false;
  }
}

/** Returns payment methods; seeds defaults on first run. */
export async function getPaymentMethods(onlyActive = false): Promise<PaymentMethod[]> {
  const { paymentMethods } = await cols();
  let rows = await paymentMethods.find().sort({ createdAt: 1 }).toArray();
  if (rows.length === 0) {
    const now = Date.now();
    await paymentMethods.insertMany([
      { kind: "bank", accountTitle: "Muhammad Naeem", accountNumber: "PK96BKIP9999903240912349", bankName: "Bank Islami", iban: null, active: true, createdAt: new Date(now) },
      { kind: "easypaisa", accountTitle: "I Series Digital Services", accountNumber: "0300-0000000", bankName: null, iban: null, active: false, createdAt: new Date(now + 1) },
      { kind: "jazzcash", accountTitle: "I Series Digital Services", accountNumber: "0300-0000000", bankName: null, iban: null, active: false, createdAt: new Date(now + 2) },
    ] as PaymentMethod[]);
    rows = await paymentMethods.find().sort({ createdAt: 1 }).toArray();
  }
  return onlyActive ? rows.filter((r) => r.active) : rows;
}

export const KIND_LABEL: Record<string, string> = {
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
  bank: "Bank Transfer",
};

export function normPhone(p: string) {
  return p.replace(/\D/g, "").slice(-9);
}

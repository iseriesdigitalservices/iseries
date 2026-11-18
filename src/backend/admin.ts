import "server-only"; // backend only — never bundled into the browser
import { cols, type PaymentMethod } from "@/backend/mongo";

export { ADMIN_COOKIE, isAdmin, currentAdmin, createAdminSession, revokeAdminSession } from "@/backend/adminAuth";

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

import "server-only"; // backend only — never bundled into the browser
import { randomBytes } from "crypto";
import { cols } from "@/backend/mongo";

const g = globalThis as typeof globalThis & { __authSecret?: string };

/** Secret used for sessions and for encrypting stored passwords. Set AUTH_SECRET in .env for best security. */
export async function getAuthSecret(): Promise<string> {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) return process.env.AUTH_SECRET;
  if (g.__authSecret) return g.__authSecret;
  const { settings } = await cols();
  await settings.updateOne({ _id: "auth_secret" }, { $setOnInsert: { value: randomBytes(48).toString("hex"), updatedAt: new Date() } }, { upsert: true });
  const doc = await settings.findOne({ _id: "auth_secret" });
  g.__authSecret = doc!.value;
  return g.__authSecret;
}

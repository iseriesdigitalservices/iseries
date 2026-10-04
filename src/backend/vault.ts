import "server-only"; // backend only — never bundled into the browser
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { getAuthSecret } from "@/backend/secret";
import type { User, VaultEntry } from "@/backend/mongo";

let keyCache: { secret: string; key: Buffer } | null = null;
async function key() {
  const secret = await getAuthSecret();
  if (!keyCache || keyCache.secret !== secret) keyCache = { secret, key: scryptSync(secret, "iseries-password-vault-v1", 32) };
  return keyCache.key;
}

export async function encryptPw(pw: string): Promise<string> {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", await key(), iv);
  const ct = Buffer.concat([c.update(pw, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(".");
}

export async function decryptPw(s: string): Promise<string | null> {
  try {
    const [v, iv, tag, ct] = s.split(".");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", await key(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Builds the new vault after a password change: the old password moves into history. */
export async function nextVault(user: Pick<User, "vault"> | null, newPassword: string, how: string): Promise<NonNullable<User["vault"]>> {
  const now = new Date();
  const current: VaultEntry = { enc: await encryptPw(newPassword), at: now, how };
  const history = [...(user?.vault?.history ?? [])];
  if (user?.vault?.current) history.push({ ...user.vault.current, retiredAt: now });
  return { current, history: history.slice(-30) };
}

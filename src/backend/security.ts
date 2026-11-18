import "server-only"; // backend only — never bundled into the browser
import { createHash, timingSafeEqual } from "crypto";

export function clientIp(req: Request | { headers: Headers }): string {
  const h = req.headers;
  return (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim().slice(0, 64);
}

export const userAgent = (req: Request | { headers: Headers }) => (req.headers.get("user-agent") || "").slice(0, 200);

/* ------------------------------------------------------------ rate limiter */
type Bucket = { n: number; t: number };
const g = globalThis as typeof globalThis & { __rl?: Map<string, Bucket> };
const store = (g.__rl ??= new Map<string, Bucket>());

/** Fixed-window limiter (in-memory). Returns ok=false when `max` hits are exceeded inside `windowMs`. */
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (store.size > 5000) for (const [k, b] of store) if (now - b.t > windowMs) store.delete(k);
  const b = store.get(key);
  if (!b || now - b.t >= windowMs) {
    store.set(key, { n: 1, t: now });
    return { ok: true, retryAfter: 0 };
  }
  b.n += 1;
  return b.n > max ? { ok: false, retryAfter: Math.ceil((b.t + windowMs - now) / 1000) } : { ok: true, retryAfter: 0 };
}

export function resetLimit(key: string) {
  store.delete(key);
}

export const tooMany = (retryAfter: number) =>
  `Too many attempts. Please try again in ${Math.max(1, Math.ceil(retryAfter / 60))} minute(s).`;

/* ------------------------------------------------------------------- misc */
export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Detects the real file type from its first bytes (never trust the browser-supplied type). */
export function sniffMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | null {
  if (buf.length < 12) return buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? "image/png" : null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  return null;
}

/** Cookie attributes. Works in the https preview iframe (SameSite=None; Partitioned) and on plain http. */
export function cookieOptions(req: Request, maxAge?: number) {
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  const lax = process.env.COOKIE_SAMESITE === "lax";
  if (proto === "https" && !lax) {
    return { httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/", ...(maxAge !== undefined ? { maxAge } : {}) } as const;
  }
  return { httpOnly: true, secure: proto === "https", sameSite: "lax", path: "/", ...(maxAge !== undefined ? { maxAge } : {}) } as const;
}

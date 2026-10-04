import "server-only"; // backend only — never bundled into the browser
import { Binary, MongoClient, ObjectId, type Collection, type Db } from "mongodb";

/* ------------------------------------------------------------------ types */
export type OrderItem = { slug: string; title: string; price: number };
export type OrderDocFile = { label: string; fileId: string; name: string; mime: string };

export type Order = {
  _id: ObjectId;
  orderNo: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  country: string | null;
  cnic: string | null;
  notes: string | null;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  transactionId: string | null;
  slipFileId: string | null;
  documents: OrderDocFile[];
  status: string; // pending_review | processing | completed | rejected
  adminNote: string | null;
  deliveryNote: string | null;
  deliveryFileId: string | null;
  deliveryFileName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderEvent = {
  _id: ObjectId;
  orderId: string;
  status: string;
  title: string;
  note: string | null;
  createdAt: Date;
};

export type Inquiry = {
  _id: ObjectId;
  name: string;
  phone: string;
  email: string | null;
  country: string | null;
  service: string;
  message: string | null;
  status: string;
  createdAt: Date;
};

export type PaymentMethod = {
  _id: ObjectId;
  kind: string;
  accountTitle: string;
  accountNumber: string;
  bankName: string | null;
  iban: string | null;
  active: boolean;
  createdAt: Date;
};

export type FileDoc = {
  _id: string;
  kind: string; // slip | document | delivery
  name: string;
  mime: string;
  data: Binary;
  ownerId: string | null;
  createdAt: Date;
};

export type EmailLog = {
  _id: ObjectId;
  kind: string;
  toEmail: string;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  orderId: string | null;
  createdAt: Date;
};

export type Setting = { _id: string; value: string; updatedAt: Date };

export type UserStatus = "active" | "pending" | "hold" | "inactive";
export type VaultEntry = { enc: string; at: Date; how: string };

export type User = {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  phoneKey: string;
  country: string | null;
  passwordHash: string;
  /** Encrypted copy of the password (AES-256-GCM) so the admin can help users. History keeps previous passwords. */
  vault: { current: VaultEntry; history: (VaultEntry & { retiredAt: Date })[] } | null;
  status: UserStatus;
  /** Session version: bumping it logs the user out everywhere. */
  sv: number;
  referralCode: string;
  referredBy: string | null; // user id (hex) of the person who referred this user
  payoutAccount: string | null; // where the user wants to receive referral money
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
};

export type Activity = {
  _id: ObjectId;
  userId: string;
  type: string;
  detail: string | null;
  ip: string | null;
  ua: string | null;
  at: Date;
};

export type PasswordReset = { _id: ObjectId; userId: string; codeHash: string; expiresAt: Date; attempts: number; createdAt: Date };
export type AdminSession = { _id: string; createdAt: Date; expireAt: Date; ip: string | null; ua: string | null };

export type Commission = {
  _id: ObjectId;
  referrerId: string;
  referredUserId: string;
  referredName: string;
  orderId: string;
  orderNo: string;
  orderTotal: number;
  amount: number;
  status: "earned" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
};

export type Payout = { _id: ObjectId; userId: string; amount: number; note: string | null; createdAt: Date };

/* ------------------------------------------------------------- connection */
type G = typeof globalThis & { __mongoClient?: Promise<MongoClient>; __mongoReady?: Promise<void> };
const g = globalThis as G;

/**
 * Where the database lives.
 *   1. MONGODB_URI from the environment (set this on Vercel / GoDaddy / in .env)
 *   2. a local MongoDB, only as a last resort for development
 */
export const mongoUri = () => {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (uri) return uri;
  if (process.env.NODE_ENV === "production") {
    console.error("[mongo] MONGODB_URI is not set — add it to your hosting environment variables.");
  }
  return "mongodb://127.0.0.1:27017/iseries";
};

function client() {
  if (!g.__mongoClient) {
    g.__mongoClient = new MongoClient(mongoUri(), { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, socketTimeoutMS: 20000 })
      .connect()
      .catch((e) => {
        g.__mongoClient = undefined;
        g.__mongoReady = undefined;
        throw e;
      });
  }
  return g.__mongoClient;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ phoneKey: 1 }, { unique: true }),
    db.collection("users").createIndex({ referralCode: 1 }, { unique: true }),
    db.collection("users").createIndex({ referredBy: 1 }),
    db.collection("orders").createIndex({ orderNo: 1 }, { unique: true }),
    db.collection("orders").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("orderEvents").createIndex({ orderId: 1, createdAt: 1 }),
    db.collection("commissions").createIndex({ orderId: 1 }, { unique: true }),
    db.collection("commissions").createIndex({ referrerId: 1, createdAt: -1 }),
    db.collection("payouts").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("emailLogs").createIndex({ createdAt: -1 }),
    db.collection("activity").createIndex({ userId: 1, at: -1 }),
    db.collection("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("passwordResets").createIndex({ userId: 1 }),
    db.collection("adminSessions").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

export async function getDb(): Promise<Db> {
  const c = await client();
  const db = c.db(process.env.MONGODB_DB || undefined);
  if (!g.__mongoReady) {
    g.__mongoReady = ensureIndexes(db).catch((e) => {
      g.__mongoReady = undefined;
      console.error("[mongo] index error", e);
    });
  }
  await g.__mongoReady;
  return db;
}

export async function cols() {
  const db = await getDb();
  const c = <T extends object>(name: string) => db.collection(name) as unknown as Collection<T>;
  return {
    users: c<User>("users"),
    orders: c<Order>("orders"),
    orderEvents: c<OrderEvent>("orderEvents"),
    inquiries: c<Inquiry>("inquiries"),
    paymentMethods: c<PaymentMethod>("paymentMethods"),
    files: c<FileDoc>("files"),
    emailLogs: c<EmailLog>("emailLogs"),
    settings: c<Setting>("settings"),
    commissions: c<Commission>("commissions"),
    payouts: c<Payout>("payouts"),
    activity: c<Activity>("activity"),
    passwordResets: c<PasswordReset>("passwordResets"),
    adminSessions: c<AdminSession>("adminSessions"),
  };
}

/* ---------------------------------------------------------------- helpers */
export const oid = (s: string | null | undefined): ObjectId | null =>
  s && /^[a-f0-9]{24}$/i.test(s) ? new ObjectId(s) : null;

export const hex = (id: ObjectId) => id.toHexString();

export { Binary, ObjectId };

// One-time migration: PostgreSQL (old) -> MongoDB (new).
//   DATABASE_URL=postgresql://... MONGODB_URI=mongodb://127.0.0.1:27017/iseries node scripts/migrate-pg-to-mongo.mjs [--reset]
import pg from "pg";
import { MongoClient, ObjectId, Binary } from "mongodb";

const PG = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/iseries";
const reset = process.argv.includes("--reset");

const pool = new pg.Pool({ connectionString: PG });
const mc = await new MongoClient(MONGO).connect();
const db = mc.db(process.env.MONGODB_DB || undefined);

const q = async (sql) => {
  try {
    return (await pool.query(sql)).rows;
  } catch (e) {
    console.log("skip:", e.message);
    return [];
  }
};

const names = ["orders", "orderEvents", "inquiries", "paymentMethods", "files", "emailLogs", "settings"];
if (!reset) {
  for (const n of names) {
    if ((await db.collection(n).countDocuments()) > 0) {
      console.log(`Collection "${n}" is not empty. Use --reset to overwrite.`);
      process.exit(1);
    }
  }
} else {
  for (const n of names) await db.collection(n).deleteMany({});
}

// payment methods
for (const r of await q("select * from payment_methods order by id")) {
  await db.collection("paymentMethods").insertOne({
    _id: new ObjectId(), kind: r.kind, accountTitle: r.account_title, accountNumber: r.account_number,
    bankName: r.bank_name ?? null, iban: r.iban ?? null, active: r.active, createdAt: r.created_at,
  });
}
// files
for (const r of await q("select * from files")) {
  await db.collection("files").insertOne({
    _id: r.id, kind: r.kind, name: r.name, mime: r.mime, data: new Binary(r.data), ownerId: null, createdAt: r.created_at,
  });
}
// orders
const idMap = new Map();
for (const r of await q("select * from orders order by id")) {
  const _id = new ObjectId();
  idMap.set(r.id, _id.toHexString());
  await db.collection("orders").insertOne({
    _id, orderNo: r.order_no, userId: null, name: r.name, phone: r.phone, email: r.email ?? null, country: r.country ?? null,
    cnic: r.cnic ?? null, notes: r.notes ?? null, items: r.items, total: r.total, paymentMethod: r.payment_method,
    transactionId: r.transaction_id ?? null, slipFileId: r.slip_file_id ?? null, documents: r.documents ?? [],
    status: r.status === "approved" ? "processing" : r.status, adminNote: r.admin_note ?? null, deliveryNote: r.delivery_note ?? null,
    deliveryFileId: r.delivery_file_id ?? null, deliveryFileName: r.delivery_file_name ?? null,
    createdAt: r.created_at, updatedAt: r.updated_at,
  });
}
// order events
for (const r of await q("select * from order_events order by id")) {
  const orderId = idMap.get(r.order_id);
  if (!orderId) continue;
  await db.collection("orderEvents").insertOne({
    _id: new ObjectId(), orderId, status: r.status, title: r.title, note: r.note ?? null, createdAt: r.created_at,
  });
}
// inquiries
for (const r of await q("select * from inquiries order by id")) {
  await db.collection("inquiries").insertOne({
    _id: new ObjectId(), name: r.name, phone: r.phone, email: r.email ?? null, country: r.country ?? null,
    service: r.service, message: r.message ?? null, status: r.status, createdAt: r.created_at,
  });
}
// email logs
for (const r of await q("select * from email_logs order by id")) {
  await db.collection("emailLogs").insertOne({
    _id: new ObjectId(), kind: r.kind, toEmail: r.to_email, subject: r.subject, body: r.body, status: r.status,
    error: r.error ?? null, orderId: r.order_id ? idMap.get(r.order_id) ?? null : null, createdAt: r.created_at,
  });
}
// settings
for (const r of await q("select * from settings")) {
  if (r.key === "relay_wait") continue;
  await db.collection("settings").insertOne({ _id: r.key, value: r.value, updatedAt: r.updated_at });
}

for (const n of names) console.log(n.padEnd(16), await db.collection(n).countDocuments());
await mc.close();
await pool.end();

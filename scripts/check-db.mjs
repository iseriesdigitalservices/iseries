/**
 * Quick database check:   node scripts/check-db.mjs
 * Shows which database the app will use and what is inside it.
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

for (const file of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not set (check your .env file).");
  process.exit(1);
}
const kind = uri.includes("mongodb+srv") ? "MongoDB Atlas (cloud)" : "local MongoDB";
console.log("Using:", kind);
console.log("URI  :", uri.replace(/(:\/\/[^:]+:)[^@]+(@)/, "$1*****$2"));

try {
  const c = await new MongoClient(uri, { serverSelectionTimeoutMS: 20000 }).connect();
  const db = c.db();
  console.log("\n✅ Connected — database:", db.databaseName, "\n");
  for (const n of ["users", "orders", "orderEvents", "inquiries", "paymentMethods", "files", "emailLogs", "settings", "commissions", "payouts", "activity"]) {
    console.log("  " + n.padEnd(16), await db.collection(n).countDocuments());
  }
  const orders = await db.collection("orders").find({}, { projection: { orderNo: 1, name: 1, status: 1, total: 1 } }).sort({ createdAt: -1 }).limit(10).toArray();
  if (orders.length) {
    console.log("\n  latest orders:");
    for (const o of orders) console.log(`    ${o.orderNo}  ${o.name}  Rs ${o.total}  [${o.status}]`);
  }
  await c.close();
} catch (e) {
  console.error("\n❌ Could not connect:", e.message.slice(0, 200));
  console.error("\nIf this is Atlas: open cloud.mongodb.com → Network Access →");
  console.error("Add IP Address → Allow access from anywhere (0.0.0.0/0).");
  process.exit(1);
}

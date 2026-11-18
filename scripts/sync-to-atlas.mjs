/**
 * Copy the whole database from one MongoDB to another (local  ->  Atlas).
 *
 *   FROM="mongodb://127.0.0.1:27017/iseries" \
 *   TO="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/iseries" \
 *   node scripts/sync-to-atlas.mjs --reset
 *
 * If FROM / TO are not given it uses LOCAL_MONGODB_URI and MONGODB_URI from the environment.
 * --reset  empties each collection in the destination before copying.
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

// load .env (simple parser, no dependency)
try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const FROM = process.env.FROM || process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/iseries";
const TO = process.env.TO || process.env.MONGODB_URI;
const reset = process.argv.includes("--reset");

if (!TO) {
  console.error("Set TO=<destination connection string> (or MONGODB_URI in .env)");
  process.exit(1);
}
const hide = (u) => u.replace(/(:\/\/[^:]+:)[^@]+(@)/, "$1*****$2");
console.log("FROM:", hide(FROM));
console.log("TO  :", hide(TO));

const COLLECTIONS = [
  "users",
  "orders",
  "orderEvents",
  "inquiries",
  "paymentMethods",
  "files",
  "emailLogs",
  "settings",
  "commissions",
  "payouts",
  "activity",
];

let src, dst;
try {
  src = await new MongoClient(FROM, { serverSelectionTimeoutMS: 15000 }).connect();
} catch (e) {
  console.error("\n❌ Could not connect to the SOURCE database:", e.message);
  process.exit(1);
}
try {
  dst = await new MongoClient(TO, { serverSelectionTimeoutMS: 20000 }).connect();
} catch (e) {
  console.error("\n❌ Could not connect to the DESTINATION (Atlas):", e.message);
  console.error("\nMost common cause: your IP is not allowed.");
  console.error("Fix: Atlas → Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0).");
  await src.close();
  process.exit(1);
}

const a = src.db();
const b = dst.db();
console.log(`\nCopying "${a.databaseName}"  ->  "${b.databaseName}"\n`);

for (const name of COLLECTIONS) {
  const docs = await a.collection(name).find().toArray();
  if (reset) await b.collection(name).deleteMany({});
  if (docs.length) {
    // upsert one by one so re-running never creates duplicates
    const ops = docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
    await b.collection(name).bulkWrite(ops, { ordered: false });
  }
  console.log(`  ${name.padEnd(16)} ${String(docs.length).padStart(4)} copied   (destination now has ${await b.collection(name).countDocuments()})`);
}

await src.close();
await dst.close();
console.log("\n✅ Done. Your data is now in Atlas.");

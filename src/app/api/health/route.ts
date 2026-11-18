import { getDb } from "@/backend/mongo";

export const dynamic = "force-dynamic";

/**
 * Always answers quickly so uptime checks never hang.
 * `ok`    = the web app itself is running
 * `mongo` = whether the database answered within 3 seconds
 */
export async function GET() {
  const probe = getDb()
    .then(() => true)
    .catch(() => false);
  const timeout = new Promise<false>((r) => setTimeout(() => r(false), 3000));
  const mongo = await Promise.race([probe, timeout]);
  return Response.json({ ok: true, mongo }, { headers: { "Cache-Control": "no-store" } });
}

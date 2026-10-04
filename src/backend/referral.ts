import "server-only"; // backend only — never bundled into the browser
import { cols, hex, oid, ObjectId, type Commission, type Order, type User } from "@/backend/mongo";
import { REFERRAL_RATE } from "@/shared/site";

const ACTIVE = ["processing", "approved", "completed"];

/**
 * Keeps the referral commission of an order in sync with its status.
 * - payment approved / in process / completed  → commission "earned" (10% of order total, once per order)
 * - payment rejected                           → commission "cancelled"
 * Returns the newly created commission (so the caller can notify), if any.
 */
export async function syncCommission(order: Order): Promise<{ created: Commission | null; referrer: User | null }> {
  const none = { created: null, referrer: null };
  const uid = oid(order.userId);
  if (!uid) return none;
  const { users, commissions } = await cols();
  const buyer = await users.findOne({ _id: uid });
  if (!buyer?.referredBy) return none;
  const orderId = hex(order._id);
  const now = new Date();

  if (!ACTIVE.includes(order.status)) {
    await commissions.updateOne({ orderId }, { $set: { status: "cancelled", updatedAt: now } });
    return none;
  }

  const refUser = oid(buyer.referredBy) ? await users.findOne({ _id: oid(buyer.referredBy)! }) : null;
  if (!refUser) return none; // the referrer account no longer exists

  const amount = Math.round(order.total * REFERRAL_RATE);
  const existing = await commissions.findOne({ orderId });
  if (existing) {
    if (existing.status !== "earned") await commissions.updateOne({ _id: existing._id }, { $set: { status: "earned", amount, updatedAt: now } });
    return none;
  }
  const doc: Commission = {
    _id: new ObjectId(),
    referrerId: buyer.referredBy,
    referredUserId: hex(buyer._id),
    referredName: buyer.name,
    orderId,
    orderNo: order.orderNo,
    orderTotal: order.total,
    amount,
    status: "earned",
    createdAt: now,
    updatedAt: now,
  };
  try {
    await commissions.insertOne(doc);
  } catch {
    return none; // another request created it first
  }
  const refId = oid(buyer.referredBy);
  const referrer = refId ? await users.findOne({ _id: refId }) : null;
  return { created: doc, referrer };
}

export async function balanceFor(userId: string) {
  const { commissions, payouts } = await cols();
  const e = await commissions
    .aggregate<{ t: number }>([{ $match: { referrerId: userId, status: "earned" } }, { $group: { _id: null, t: { $sum: "$amount" } } }])
    .toArray();
  const p = await payouts.aggregate<{ t: number }>([{ $match: { userId } }, { $group: { _id: null, t: { $sum: "$amount" } } }]).toArray();
  const earned = e[0]?.t ?? 0;
  const paid = p[0]?.t ?? 0;
  return { earned, paid, balance: earned - paid };
}

/** Everything the profile page needs about a user's referral business. */
export async function referralOverview(userId: string) {
  const { users, commissions, payouts, orders } = await cols();
  const [referred, comms, pays, bal] = await Promise.all([
    users.find({ referredBy: userId }).sort({ createdAt: -1 }).toArray(),
    commissions.find({ referrerId: userId }).sort({ createdAt: -1 }).toArray(),
    payouts.find({ userId }).sort({ createdAt: -1 }).toArray(),
    balanceFor(userId),
  ]);
  const ids = referred.map((r) => hex(r._id));
  const refOrders = ids.length
    ? await orders.find({ userId: { $in: ids } }, { projection: { userId: 1, total: 1, status: 1 } }).toArray()
    : [];
  const pendingOrders = refOrders.filter((o) => o.status === "pending_review");
  const pending = Math.round(pendingOrders.reduce((a, o) => a + o.total, 0) * REFERRAL_RATE);
  const referredRows = referred.map((r) => {
    const id = hex(r._id);
    const mine = refOrders.filter((o) => o.userId === id);
    const earned = comms.filter((c) => c.referredUserId === id && c.status === "earned").reduce((a, c) => a + c.amount, 0);
    return { id, name: r.name, joined: r.createdAt, orders: mine.length, earned };
  });
  return { ...bal, pending, referred: referredRows, commissions: comms, payouts: pays };
}

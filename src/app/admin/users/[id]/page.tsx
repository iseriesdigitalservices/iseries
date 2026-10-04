import Link from "next/link";
import { isAdmin } from "@/backend/admin";
import { notFound } from "next/navigation";
import { cols, hex, oid } from "@/backend/mongo";
import AdminForm from "@/frontend/components/AdminForm";
import PasswordReveal from "@/frontend/components/PasswordReveal";
import Pager, { paginate } from "@/frontend/components/Pager";
import { ACTIVITY_LABEL } from "@/backend/activity";
import { referralOverview } from "@/backend/referral";
import { ORDER_STATUS, formatPKR } from "@/shared/site";
import { STATUS_ORDER, USER_STATUS } from "@/frontend/userStatus";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-black";

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <p className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{k}</span>
      <b className="break-anywhere text-right">{v || "—"}</b>
    </p>
  );
}

const tone: Record<string, string> = {
  login: "bg-green-500",
  login_failed: "bg-red-500",
  password_change: "bg-amber-500",
  password_reset_done: "bg-amber-500",
  password_reset_requested: "bg-amber-400",
  admin_status: "bg-blue-500",
  admin_password_set: "bg-blue-500",
  admin_viewed_password: "bg-blue-400",
  order_placed: "bg-black",
};

export default async function UserDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ord?: string; act?: string }> }) {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const { id } = await params;
  const sp = await searchParams;
  const _id = oid(id);
  if (!_id) notFound();
  const { users, orders, activity } = await cols();
  const u = await users.findOne({ _id }, { projection: { passwordHash: 0, vault: 0 } });
  if (!u) notFound();
  const uid = hex(u._id);
  const [myOrders, acts, ref, referrer, rawVault] = await Promise.all([
    orders.find({ userId: uid }).sort({ createdAt: -1 }).toArray(),
    activity.find({ userId: uid }).sort({ at: -1 }).limit(500).toArray(),
    referralOverview(uid),
    u.referredBy && oid(u.referredBy) ? users.findOne({ _id: oid(u.referredBy)! }, { projection: { name: 1, referralCode: 1 } }) : Promise.resolve(null),
    users.findOne({ _id }, { projection: { vault: 1 } }),
  ]);
  const ordPage = paginate(myOrders, sp.ord);
  const actPage = paginate(acts, sp.act);
  const changes = rawVault?.vault?.history.length ?? 0;
  const status = u.status ?? "active";
  const s = USER_STATUS[status];

  return (
    <div className="space-y-5">
      <Link href="/admin/users" className="text-sm text-slate-600 hover:underline">← All users</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black">{u.name}</h1>
          <p className="break-all text-sm text-slate-600">{u.email} · {u.phone}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${s.cls}`}>{s.label}</span>
          <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ACCESS CONTROL */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">Account access</h2>
          <p className="mb-3 text-xs text-slate-500">Choose what this user is allowed to do. Any status other than Active logs them out immediately.</p>
          <AdminForm action="user_status" hidden={{ userId: uid }} inline className="grid grid-cols-2 gap-2">
            {STATUS_ORDER.map((x) => (
              <button
                key={x}
                name="status"
                value={x}
                disabled={x === status}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold ${x === status ? "cursor-default bg-black text-[#f5c518]" : "border border-slate-300 hover:bg-slate-100"}`}
              >
                {x === status ? `✓ ${USER_STATUS[x].label}` : x === "active" ? "Activate" : x === "inactive" ? "Deactivate" : x === "hold" ? "Put on hold" : "Set pending"}
              </button>
            ))}
          </AdminForm>
          <AdminForm action="user_delete" hidden={{ userId: uid }} redirectTo="/admin/users" confirm={`Delete ${u.name}'s account permanently? Their orders stay in the order list. This cannot be undone.`} className="mt-5 border-t border-slate-200 pt-4">
            <button className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700">🗑 Delete this user</button>
          </AdminForm>
        </section>

        {/* PASSWORD */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">Password</h2>
          <p className="mb-3 text-xs text-slate-500">
            Passwords are stored encrypted. Showing them is logged in the user&apos;s activity. {changes > 0 ? `Changed ${changes} time${changes > 1 ? "s" : ""}.` : ""}
          </p>
          <PasswordReveal userId={uid} />
          <AdminForm action="user_set_password" hidden={{ userId: uid }} className="mt-5 border-t border-slate-200 pt-4">
            <label className="block text-xs font-semibold text-slate-500">Set a new password for this user</label>
            <div className="flex gap-2">
              <input name="password" required minLength={8} placeholder="New password (8+ chars, letters + numbers)" autoComplete="off" className={inp} />
              <button className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-bold text-[#f5c518]">Save</button>
            </div>
          </AdminForm>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold">Profile</h2>
          <div className="divide-y divide-slate-100">
            <Row k="Name" v={u.name} />
            <Row k="Email" v={u.email} />
            <Row k="Phone" v={u.phone} />
            <Row k="Country" v={u.country} />
            <Row k="Registered" v={u.createdAt.toLocaleString("en-GB")} />
            <Row k="Last login" v={u.lastLoginAt ? `${u.lastLoginAt.toLocaleString("en-GB")} (${u.lastLoginIp ?? "?"})` : "Never"} />
            <Row k="Payout account" v={u.payoutAccount} />
            <Row k="Referral code" v={u.referralCode} />
            <Row k="Referred by" v={referrer ? `${referrer.name} (${referrer.referralCode})` : null} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold">Referral earnings</h2>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
            {[
              ["Referred", ref.referred.length],
              ["Earned", formatPKR(ref.earned)],
              ["Paid", formatPKR(ref.paid)],
              ["Balance", formatPKR(ref.balance)],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl bg-slate-50 p-2">
                <p className="text-slate-500">{l}</p>
                <p className="text-sm font-black">{v}</p>
              </div>
            ))}
          </div>
          {ref.balance > 0 && (
            <AdminForm action="payout_add" hidden={{ userId: uid }} className="mt-4 grid gap-2 sm:grid-cols-3">
              <input name="amount" type="number" min={1} max={ref.balance} defaultValue={ref.balance} required className={inp} />
              <input name="note" placeholder="Note / transaction ref" className={inp} />
              <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-[#f5c518]">💸 Record deposit</button>
            </AdminForm>
          )}
          {ref.referred.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 text-xs">
              {ref.referred.map((r) => (
                <li key={r.id} className="flex justify-between py-1.5">
                  <Link href={`/admin/users/${r.id}`} className="font-semibold hover:underline">{r.name}</Link>
                  <span>{r.orders} orders · {formatPKR(r.earned)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Orders ({myOrders.length})</h2>
        {myOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ordPage.items.map((o) => (
              <Link key={hex(o._id)} href={`/admin/orders/${hex(o._id)}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:opacity-80">
                <div className="min-w-0">
                  <p className="font-black tracking-wider">{o.orderNo}</p>
                  <p className="truncate text-xs text-slate-500">{o.items.map((i) => i.title).join(" • ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPKR(o.total)}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ORDER_STATUS[o.status]?.cls}`}>{ORDER_STATUS[o.status]?.short}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pager basePath={`/admin/users/${uid}`} param="ord" params={{ act: sp.act }} page={ordPage.page} pages={ordPage.pages} total={ordPage.total} label="orders" />
      </section>

      <section id="activity" className="scroll-mt-28 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Activity ({acts.length})</h2>
        {acts.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            {actPage.items.map((a) => (
              <li key={hex(a._id)} className="relative">
                <span className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full ${tone[a.type] ?? "bg-slate-400"}`} />
                <p className="text-sm font-semibold">{ACTIVITY_LABEL[a.type] ?? a.type}</p>
                {a.detail && <p className="break-anywhere text-sm text-slate-600">{a.detail}</p>}
                <p className="text-xs text-slate-400">
                  {a.at.toLocaleString("en-GB")}
                  {a.ip ? ` · IP ${a.ip}` : ""}
                </p>
                {a.ua && <p className="break-anywhere text-[11px] text-slate-400">{a.ua}</p>}
              </li>
            ))}
          </ol>
        )}
        <Pager basePath={`/admin/users/${uid}`} param="act" params={{ ord: sp.ord }} page={actPage.page} pages={actPage.pages} total={actPage.total} label="events" hash="activity" />
      </section>
    </div>
  );
}

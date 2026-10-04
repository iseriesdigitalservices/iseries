import Link from "next/link";
import { isAdmin } from "@/backend/admin";
import { Search } from "lucide-react";
import { cols, hex, type UserStatus } from "@/backend/mongo";
import AdminForm from "@/frontend/components/AdminForm";
import Pager, { paginate } from "@/frontend/components/Pager";
import { getSetting } from "@/backend/mail";
import { REFERRAL_RATE, formatPKR } from "@/shared/site";
import { STATUS_ORDER, USER_STATUS } from "@/frontend/userStatus";

export const dynamic = "force-dynamic";

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const { q = "", status = "all", page: pageParam } = await searchParams;
  const { users, orders, commissions, payouts } = await cols();
  const [allUsers, allOrders, allComms, allPays, approval] = await Promise.all([
    users.find({}, { projection: { passwordHash: 0, vault: 0 } }).sort({ createdAt: -1 }).toArray(),
    orders.find({ userId: { $ne: null } }, { projection: { userId: 1 } }).toArray(),
    commissions.find({ status: "earned" }).toArray(),
    payouts.find().toArray(),
    getSetting("require_approval"),
  ]);
  const st = (u: { status?: UserStatus }) => u.status ?? "active";
  const needle = q.trim().toLowerCase();
  const filtered = allUsers
    .filter((u) => status === "all" || st(u) === status)
    .filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.email.includes(needle) || u.phone.includes(needle) || u.referralCode.toLowerCase().includes(needle));
  const { items: list, page, pages, total } = paginate(filtered, pageParam);
  const count = (s: string) => (s === "all" ? allUsers.length : allUsers.filter((u) => st(u) === s).length);
  const totalEarned = allComms.reduce((a, c) => a + c.amount, 0);
  const totalPaid = allPays.reduce((a, p) => a + p.amount, 0);
  const requireApproval = approval === "1";

  return (
    <div>
      <h1 className="text-2xl font-black">Users</h1>
      <p className="mt-1 text-sm text-slate-600">Manage every customer account: status, password, activity and referral payouts. Referral commission is {REFERRAL_RATE * 100}% of each approved order.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Users", String(allUsers.length), "bg-white"],
          ["Needs attention", String(count("pending") + count("hold")), "bg-amber-50 ring-1 ring-amber-300"],
          ["Commission earned", formatPKR(totalEarned), "bg-white"],
          ["Total paid out", formatPKR(totalPaid), "bg-green-50 ring-1 ring-green-200"],
        ].map(([l, v, c]) => (
          <div key={l} className={`rounded-2xl p-4 shadow-sm ${c}`}>
            <p className="text-[11px] font-semibold uppercase text-slate-500">{l}</p>
            <p className="text-2xl font-black">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-bold">New registrations: {requireApproval ? "need your approval" : "active immediately"}</p>
          <p className="text-xs text-slate-500">{requireApproval ? "New users start as Pending until you activate them." : "Turn this on if you want to approve each new user first."}</p>
        </div>
        <AdminForm action="reg_approval" hidden={{ on: requireApproval ? "0" : "1" }} inline>
          <button className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-[#f5c518]">{requireApproval ? "Turn off approval" : "Require approval"}</button>
        </AdminForm>
      </div>

      <form className="mt-4 flex gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search name, email, phone, code" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black" />
        </div>
        <button className="rounded-xl bg-black px-5 text-sm font-semibold text-[#f5c518]">Search</button>
      </form>

      <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ k: "all", l: "All" }, ...STATUS_ORDER.map((s) => ({ k: s, l: USER_STATUS[s].label }))].map((t) => (
          <Link
            key={t.k}
            href={`/admin/users?${new URLSearchParams({ ...(t.k !== "all" ? { status: t.k } : {}), ...(q ? { q } : {}) }).toString()}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${status === t.k ? "bg-black text-[#f5c518]" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {t.l} ({count(t.k)})
          </Link>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {total === 0 && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">No users found.</p>}
        {list.map((u) => {
          const id = hex(u._id);
          const earned = allComms.filter((c) => c.referrerId === id).reduce((a, c) => a + c.amount, 0);
          const paid = allPays.filter((p) => p.userId === id).reduce((a, p) => a + p.amount, 0);
          const s = USER_STATUS[st(u)];
          return (
            <div key={id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/users/${id}`} className="text-lg font-black hover:underline">{u.name}</Link>
                  <p className="break-all text-sm text-slate-600">{u.email} · {u.phone}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Joined {u.createdAt.toLocaleDateString("en-GB")} · {allOrders.filter((o) => o.userId === id).length} orders · Last login {u.lastLoginAt ? u.lastLoginAt.toLocaleString("en-GB") : "never"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                  <p className="mt-1 text-xs text-slate-500">Balance {formatPKR(earned - paid)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AdminForm action="user_status" hidden={{ userId: id }} inline className="flex flex-wrap gap-2">
                  {STATUS_ORDER.filter((x) => x !== st(u)).map((x) => (
                    <button key={x} name="status" value={x} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100">
                      {x === "active" ? "Activate" : x === "inactive" ? "Deactivate" : x === "hold" ? "Put on hold" : "Set pending"}
                    </button>
                  ))}
                </AdminForm>
                <Link href={`/admin/users/${id}`} className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-[#f5c518]">Manage · password · activity</Link>
              </div>
            </div>
          );
        })}
      </div>
      <Pager basePath="/admin/users" params={{ ...(status !== "all" ? { status } : {}), ...(q ? { q } : {}) }} page={page} pages={pages} total={total} label="users" />
    </div>
  );
}

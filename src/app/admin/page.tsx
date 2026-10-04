import Link from "next/link";
import { isAdmin } from "@/backend/admin";
import { FileImage, Search } from "lucide-react";
import { cols, hex } from "@/backend/mongo";
import Pager, { paginate } from "@/frontend/components/Pager";
import { ORDER_STATUS, formatPKR } from "@/shared/site";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending review" },
  { key: "processing", label: "In process" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

const norm = (s: string) => (s === "approved" ? "processing" : s);

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const { status = "all", q = "", page: pageParam } = await searchParams;
  const { orders } = await cols();
  const all = await orders.find().sort({ createdAt: -1 }).toArray();
  const count = (k: string) => (k === "all" ? all.length : all.filter((o) => norm(o.status) === k).length);
  const needle = q.trim().toLowerCase();
  const filtered = all
    .filter((o) => status === "all" || norm(o.status) === status)
    .filter(
      (o) =>
        !needle ||
        o.orderNo.toLowerCase().includes(needle) ||
        o.name.toLowerCase().includes(needle) ||
        o.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, "") || "§") ||
        (o.email ?? "").toLowerCase().includes(needle),
    );
  const { items: rows, page, pages, total } = paginate(filtered, pageParam);
  const revenue = all.filter((o) => ["processing", "approved", "completed"].includes(o.status)).reduce((a, o) => a + o.total, 0);

  const stat = [
    { l: "Total orders", v: all.length, c: "bg-white" },
    { l: "Needs review", v: count("pending_review"), c: "bg-amber-50 ring-1 ring-amber-300" },
    { l: "In process", v: count("processing"), c: "bg-blue-50 ring-1 ring-blue-200" },
    { l: "Completed", v: count("completed"), c: "bg-green-50 ring-1 ring-green-200" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stat.map((s) => (
          <div key={s.l} className={`rounded-2xl p-4 shadow-sm ${s.c}`}>
            <p className="text-[11px] font-semibold uppercase text-slate-500">{s.l}</p>
            <p className="text-3xl font-black">{s.v}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-2xl bg-black p-4 text-white shadow-sm lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Approved revenue</p>
          <p className="text-2xl font-black text-[#f5c518]">{formatPKR(revenue)}</p>
        </div>
      </div>

      <form className="mt-5 flex gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order no, name, phone, email"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black"
          />
        </div>
        <button className="rounded-xl bg-black px-5 text-sm font-semibold text-[#f5c518]">Search</button>
      </form>

      <div className="-mx-3 mt-4 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?${new URLSearchParams({ ...(t.key !== "all" ? { status: t.key } : {}), ...(q ? { q } : {}) }).toString()}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              status === t.key ? "bg-black text-[#f5c518]" : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {t.label} ({count(t.key)})
          </Link>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {total === 0 && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">No orders found.</p>}
        {rows.map((o) => {
          const st = ORDER_STATUS[o.status];
          return (
            <Link
              key={hex(o._id)}
              href={`/admin/orders/${hex(o._id)}`}
              className={`block rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${o.status === "pending_review" ? "ring-2 ring-amber-300" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black tracking-wider">{o.orderNo}{o.userId && <span className="ml-2 rounded bg-black px-1.5 py-0.5 align-middle text-[10px] font-bold text-[#f5c518]">ACCOUNT</span>}</p>
                  <p className="truncate font-semibold">{o.name}</p>
                  <p className="text-xs text-slate-500">{o.phone}{o.country ? ` · ${o.country}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black">{formatPKR(o.total)}</p>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${st?.cls}`}>{st?.short}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{o.items.map((i) => i.title).join(" • ")}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FileImage className="h-3.5 w-3.5" /> {o.documents.length + 1} files (slip + docs)
                </span>
                <span>{o.createdAt.toLocaleString("en-GB")}</span>
              </div>
            </Link>
          );
        })}
      </div>
      <Pager basePath="/admin" params={{ ...(status !== "all" ? { status } : {}), ...(q ? { q } : {}) }} page={page} pages={pages} total={total} label="orders" />
    </div>
  );
}

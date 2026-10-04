import { MessageCircle } from "lucide-react";
import { isAdmin } from "@/backend/admin";
import { cols, hex } from "@/backend/mongo";
import AdminForm from "@/frontend/components/AdminForm";
import Pager, { PAGE_SIZE, pageFrom } from "@/frontend/components/Pager";

export const dynamic = "force-dynamic";

const badge: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  closed: "bg-green-100 text-green-700",
};
const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function InquiriesAdmin({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await isAdmin())) return null; // never run queries or render data for visitors
  const sp = await searchParams;
  const { inquiries } = await cols();
  const total = await inquiries.countDocuments();
  const { page, pages, skip } = pageFrom(sp.page, total);
  const rows = await inquiries.find().sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).toArray();
  return (
    <div>
      <h1 className="text-2xl font-black">Inquiries ({total})</h1>
      <div className="mt-5 space-y-4">
        {rows.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">No inquiries yet.</p>}
        {rows.map((r) => (
          <div key={hex(r._id)} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{r.name}</p>
                <p className="text-sm text-slate-600">
                  {r.phone}
                  {r.email && <> · {r.email}</>}
                  {r.country && <> · {r.country}</>}
                </p>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[r.status] ?? ""}`}>{r.status}</span>
                <p className="mt-1 text-xs text-slate-400">{r.createdAt.toLocaleString("en-GB")}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold">{r.service}</p>
            {r.message && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{r.message}</p>}
            <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <AdminForm action="inquiry_status" hidden={{ id: hex(r._id) }} inline className="mt-3 flex flex-wrap gap-2">
              {["new", "contacted", "closed"].map((s) => (
                <button key={s} name="status" value={s} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium capitalize hover:bg-slate-100">
                  Mark {s}
                </button>
              ))}
            </AdminForm>
            {r.email && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold">✉ Reply by email</summary>
                <AdminForm action="send_mail" hidden={{ to: r.email }} className="mt-3">
                  <input name="subject" required defaultValue={`Re: ${r.service}`} className={inp} />
                  <textarea name="body" required rows={4} placeholder="Message..." className={inp} />
                  <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-[#f5c518]">Send email</button>
                </AdminForm>
              </details>
            )}
          </div>
        ))}
      </div>
      <Pager basePath="/admin/inquiries" page={page} pages={pages} total={total} label="inquiries" />
    </div>
  );
}

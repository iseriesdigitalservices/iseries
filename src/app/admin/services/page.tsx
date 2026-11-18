import { isAdmin } from "@/backend/adminAuth";
import { getAllServices } from "@/backend/config";
import { cols } from "@/backend/mongo";
import AdminForm from "@/frontend/components/AdminForm";
import { DOC_KEYS, ICON_NAMES, formatPKR, type Service } from "@/shared/site";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-black";
const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const BLANK: Service = {
  slug: "",
  title: "",
  urdu: "",
  desc: "",
  points: [],
  icon: "FileCheck2",
  price: null,
  docs: [
    { key: "cnicFront", label: "CNIC — Front", required: true },
    { key: "cnicBack", label: "CNIC — Back", required: true },
  ],
  active: true,
};

function Editor({ s, isNew = false, count = 0 }: { s: Service; isNew?: boolean; count?: number }) {
  return (
    <AdminForm action="service_save" hidden={{ slug: s.slug }} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>Title *</label>
          <input name="title" required defaultValue={s.title} placeholder="e.g. Passport Services" className={inp} />
        </div>
        <div>
          <label className={lbl}>Web address (slug)</label>
          <input name="newSlug" defaultValue={s.slug} placeholder="passport-services" className={inp} />
        </div>
        <div>
          <label className={lbl}>Urdu title</label>
          <input name="urdu" defaultValue={s.urdu} dir="rtl" className={`${inp} urdu`} />
        </div>
        <div>
          <label className={lbl}>Price in Rs — leave empty for &quot;on work basis&quot;</label>
          <input name="price" type="number" min={0} step={500} defaultValue={s.price ?? ""} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Short description</label>
          <textarea name="desc" rows={2} defaultValue={s.desc} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>What we do (one point per line)</label>
          <textarea name="points" rows={4} defaultValue={s.points.join("\n")} className={inp} />
        </div>
        <div>
          <label className={lbl}>Icon</label>
          <select name="icon" defaultValue={s.icon} className={inp}>
            {ICON_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={s.active !== false} /> Show on the website
        </label>
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Documents the customer must upload</p>
        <div className="space-y-2">
          {DOC_KEYS.map((d) => {
            const cur = s.docs.find((x) => x.key === d.key);
            const mode = !cur ? "off" : cur.required ? "required" : "optional";
            return (
              <div key={d.key} className="grid gap-2 sm:grid-cols-[150px_1fr]">
                <select name={`doc_${d.key}`} defaultValue={mode} className={inp}>
                  <option value="off">Not needed</option>
                  <option value="optional">Optional</option>
                  <option value="required">Required</option>
                </select>
                <input name={`doclabel_${d.key}`} defaultValue={cur?.label ?? d.label} className={inp} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-[#f5c518]">{isNew ? "Add service" : "Save changes"}</button>
      </div>
    </AdminForm>
  );
}

export default async function ServicesAdmin() {
  if (!(await isAdmin())) return null;
  const services = await getAllServices();
  const { orders } = await cols();
  const all = await orders.find({}, { projection: { items: 1 } }).toArray();
  const used = new Map<string, number>();
  for (const o of all) for (const i of o.items) used.set(i.slug, (used.get(i.slug) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Services &amp; Prices</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add, edit, hide, reorder or delete any service. Changes show on the website straight away.
        </p>
      </div>

      <section className="rounded-2xl border-2 border-dashed border-slate-300 p-5">
        <details>
          <summary className="cursor-pointer text-lg font-black">➕ Add a new service</summary>
          <div className="mt-4">
            <Editor s={BLANK} isNew count={services.length} />
          </div>
        </details>
      </section>

      <div className="space-y-4">
        {services.map((s, i) => (
          <section key={s.slug} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black">
                  {s.title}{" "}
                  {s.active === false && <span className="rounded bg-slate-200 px-2 py-0.5 align-middle text-[10px] font-bold uppercase">Hidden</span>}
                </h2>
                <p className="text-xs text-slate-500">
                  /services/{s.slug} · {s.price != null ? formatPKR(s.price) : "On work basis"} · {used.get(s.slug) ?? 0} orders
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <AdminForm action="service_move" hidden={{ slug: s.slug, dir: "up" }} inline>
                  <button disabled={i === 0} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold disabled:opacity-30">↑</button>
                </AdminForm>
                <AdminForm action="service_move" hidden={{ slug: s.slug, dir: "down" }} inline>
                  <button disabled={i === services.length - 1} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold disabled:opacity-30">↓</button>
                </AdminForm>
                <AdminForm
                  action="service_delete"
                  hidden={{ slug: s.slug }}
                  confirm={`Delete "${s.title}" permanently?${used.get(s.slug) ? ` ${used.get(s.slug)} existing orders keep their copy and are not affected.` : ""}`}
                  inline
                >
                  <button className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Delete</button>
                </AdminForm>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold">Edit this service</summary>
              <div className="mt-3">
                <Editor s={s} />
              </div>
            </details>
          </section>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Start over</h2>
        <p className="mb-3 text-xs text-slate-500">Deletes your service list and restores the original built-in services.</p>
        <AdminForm action="services_reset" confirm="Replace all services with the original built-in list?" inline>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Restore built-in services</button>
        </AdminForm>
      </section>
    </div>
  );
}

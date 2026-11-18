import { isAdmin } from "@/backend/adminAuth";
import { getFaqs, getSite } from "@/backend/config";
import AdminForm from "@/frontend/components/AdminForm";
import { logoSrc } from "@/shared/site";

export const dynamic = "force-dynamic";

const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-black";
const lbl = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export default async function SettingsAdmin() {
  if (!(await isAdmin())) return null;
  const site = await getSite();
  const faqs = await getFaqs();
  const phones = [...site.phones, { display: "", intl: "" }, { display: "", intl: "" }].slice(0, Math.max(3, site.phones.length + 1));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Website Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Everything here changes the live website immediately — the name, logo, phone numbers, home page text and the referral rate.
        </p>
      </div>

      {/* ---------------- LOGO ---------------- */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Logo</h2>
        <p className="mb-4 text-xs text-slate-500">PNG with a transparent background works best. Max 2 MB. SVG, JPG and WEBP also work.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {([
            { which: "light", title: "Main logo", help: "Used on white / light backgrounds", bg: "bg-[#f6f4ef]" },
            { which: "dark", title: "Dark-background logo", help: "Used on the black header, footer and hero", bg: "bg-[#0a0a0a]" },
          ] as const).map((l) => (
            <div key={l.which} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold">{l.title}</p>
              <p className="mb-3 text-xs text-slate-500">{l.help}</p>
              <div className={`mb-3 flex h-24 items-center justify-center rounded-lg ${l.bg}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc(site, l.which === "dark")} alt={l.title} className="max-h-20 w-auto" />
              </div>
              <AdminForm action="logo_upload" hidden={{ which: l.which }}>
                <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className="block w-full text-sm" />
                <button className="w-full rounded-lg bg-black py-2 text-sm font-bold text-[#f5c518]">Upload new logo</button>
              </AdminForm>
              {(l.which === "light" ? site.hasLogoLight : site.hasLogoDark) && (
                <AdminForm action="logo_reset" hidden={{ which: l.which }} confirm="Go back to the built-in logo?" inline className="mt-2">
                  <button className="w-full rounded-lg border border-slate-300 py-2 text-xs font-semibold">Reset to built-in logo</button>
                </AdminForm>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- NAME / CONTACT / HOME TEXT ---------------- */}
      <AdminForm action="site_save" className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold">Business details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Website / business name *</label>
              <input name="name" required defaultValue={site.name} className={inp} />
            </div>
            <div>
              <label className={lbl}>Short name</label>
              <input name="short" defaultValue={site.short} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Tagline</label>
              <input name="tagline" defaultValue={site.tagline} className={inp} />
            </div>
            <div>
              <label className={lbl}>Contact email *</label>
              <input name="email" type="email" required defaultValue={site.email} className={inp} />
              <p className="mt-1 text-xs text-slate-500">All admin alerts are sent here.</p>
            </div>
            <div>
              <label className={lbl}>WhatsApp number (digits only, e.g. 923417427464)</label>
              <input name="whatsapp" defaultValue={site.whatsapp} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Office address (optional)</label>
              <input name="address" defaultValue={site.address} className={inp} />
            </div>
          </div>

          <h3 className="mb-2 mt-5 text-sm font-bold">Phone numbers shown on the website</h3>
          <div className="space-y-2">
            {phones.map((p, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <input name={`phone${i}`} defaultValue={p.display} placeholder={`Number ${i + 1} as shown, e.g. 0341 7427464`} className={inp} />
                <input name={`phoneIntl${i}`} defaultValue={p.intl} placeholder="Dialling format, e.g. 923417427464" className={inp} />
              </div>
            ))}
            <p className="text-xs text-slate-500">Leave a row empty to remove that number.</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold">Home page</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Headline</label>
              <input name="heroTitle" defaultValue={site.heroTitle} className={inp} />
            </div>
            <div>
              <label className={lbl}>Headline (gold part)</label>
              <input name="heroHighlight" defaultValue={site.heroHighlight} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Urdu line (leave empty to hide)</label>
              <input name="heroUrdu" defaultValue={site.heroUrdu} dir="rtl" className={`${inp} urdu`} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Intro paragraph</label>
              <textarea name="heroText" rows={3} defaultValue={site.heroText} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Footer disclaimer</label>
              <textarea name="disclaimer" rows={3} defaultValue={site.disclaimer} className={inp} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold">Refer &amp; Earn</h2>
          <label className={lbl}>Commission on each approved order (%)</label>
          <input name="referralRate" type="number" min={0} max={90} step={0.5} defaultValue={Math.round(site.referralRate * 1000) / 10} className={`${inp} max-w-[160px]`} />
          <p className="mt-1 text-xs text-slate-500">Applies to commissions credited from now on. Commissions already credited do not change.</p>
        </section>

        <button className="w-full rounded-xl bg-black py-3 text-sm font-bold text-[#f5c518] sm:w-auto sm:px-10">Save all website settings</button>
      </AdminForm>

      {/* ---------------- FAQs ---------------- */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">FAQs ({faqs.length})</h2>
        <p className="mb-4 text-xs text-slate-500">Shown on the home page and the FAQ page. Clear a question to delete it; use the empty rows to add new ones.</p>
        <AdminForm action="faqs_save">
          <div className="space-y-3">
            {[...faqs, { q: "", a: "" }, { q: "", a: "" }].map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <input name={`q${i}`} defaultValue={f.q} placeholder={`Question ${i + 1}`} className={`${inp} font-semibold`} />
                <textarea name={`a${i}`} defaultValue={f.a} rows={2} placeholder="Answer" className={`${inp} mt-2`} />
              </div>
            ))}
          </div>
          <button className="rounded-xl bg-black px-8 py-2.5 text-sm font-bold text-[#f5c518]">Save FAQs</button>
        </AdminForm>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">🔑 Admin accounts &amp; password</h2>
        <p className="mt-1 text-sm text-slate-600">
          Admin sign-in now uses an email and password. Manage accounts, change your password and view the activity log on the{" "}
          <a href="/admin/security" className="font-semibold underline">Security</a> page.
        </p>
      </section>
    </div>
  );
}

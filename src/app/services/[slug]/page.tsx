import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, FileText, MessageCircle } from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import PageBanner from "@/frontend/components/PageBanner";
import AddToCartButton from "@/frontend/components/AddToCartButton";
import ServiceCard, { ServiceIcon, quoteLink } from "@/frontend/components/ServiceCard";
import { SERVICES, SITE, formatPKR, getService } from "@/shared/site";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getService((await params).slug);
  return { title: s ? `${s.title} — I Series Digital Services` : "Service" };
}

const STEPS = [
  "Add this service to your cart",
  "Fill in your details & upload the required documents",
  "Pay by bank transfer and upload your payment slip",
  "We verify, work on your case and deliver the result",
];

export default async function ServiceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const s = getService((await params).slug);
  if (!s) notFound();
  const others = SERVICES.filter((x) => x.slug !== s.slug).slice(0, 3);

  return (
    <div>
      <Header />
      <PageBanner eyebrow="Service" title={s.title} urdu={s.urdu}>
        <p className="mt-3 max-w-2xl text-slate-300">{s.desc}</p>
      </PageBanner>

      <section className="bg-[#f6f4ef] py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="flex items-center gap-3 text-xl font-extrabold">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-gold">
                  <ServiceIcon name={s.icon} className="h-5 w-5" />
                </span>
                What we do for you
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 rounded-xl bg-[#f6f4ef] p-3 text-sm font-medium">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="flex items-center gap-3 text-xl font-extrabold">
                <FileText className="h-6 w-6" /> Documents needed
              </h2>
              <ul className="mt-4 divide-y divide-slate-100 text-sm">
                {s.docs.map((d) => (
                  <li key={d.key} className="flex items-center justify-between gap-3 py-3">
                    <span className="font-medium">{d.label}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${d.required ? "bg-black text-gold" : "bg-slate-100 text-slate-600"}`}>
                      {d.required ? "Required" : "Optional"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Your documents are 100% confidential and visible only to our team.</p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-xl font-extrabold">How to order</h2>
              <ol className="mt-4 space-y-3">
                {STEPS.map((t, i) => (
                  <li key={t} className="flex items-center gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-black text-gold">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="h-fit rounded-3xl bg-black p-6 text-white shadow-xl lg:sticky lg:top-32">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Service fee</p>
            {s.price != null ? (
              <>
                <p className="mt-1 text-4xl font-black text-gold">{formatPKR(s.price)}</p>
                <AddToCartButton slug={s.slug} large />
                <Link href="/cart" className="mt-3 block text-center text-sm text-slate-300 hover:text-gold">
                  View cart →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-1 text-3xl font-black text-gold">On work basis</p>
                <p className="mt-2 text-sm text-slate-300">Price depends on the work. Contact us for an exact quote.</p>
                <a
                  href={quoteLink(s)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 font-bold text-black"
                >
                  <MessageCircle className="h-5 w-5" /> Get a Quote on WhatsApp
                </a>
              </>
            )}
            <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-sm text-slate-300">
              <p>Questions? Call us:</p>
              {SITE.phones.map((p) => (
                <a key={p.intl} href={`tel:+${p.intl}`} className="block font-semibold text-white hover:text-gold">
                  {p.display}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-black">Other services</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <ServiceCard key={o.slug} s={o} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

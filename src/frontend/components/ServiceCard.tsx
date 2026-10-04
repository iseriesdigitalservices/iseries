import Link from "next/link";
import {
  ArrowRight,
  BookUser,
  FileCheck2,
  FileSearch,
  GraduationCap,
  IdCard,
  MessageCircle,
  PlaneTakeoff,
  Scale,
  ShieldAlert,
  SearchCheck,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import { SITE, formatPKR, type Service } from "@/shared/site";

const ICONS: Record<string, LucideIcon> = {
  BookUser,
  IdCard,
  PlaneTakeoff,
  Scale,
  ShieldCheck,
  GraduationCap,
  FileCheck2,
  Users,
  FileSearch,
  ShieldAlert,
  SearchCheck,
};

export function ServiceIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const I = ICONS[name] ?? FileCheck2;
  return <I className={className} />;
}

export function quoteLink(s: Service) {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, I need a quote for ${s.title}.`)}`;
}

export default function ServiceCard({ s }: { s: Service }) {
  const quote = (
    <a
      href={quoteLink(s)}
      target="_blank"
      rel="noreferrer"
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-[#f5c518]"
    >
      <MessageCircle className="h-4 w-4" /> Quote
    </a>
  );

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-3xl sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-black via-[#f5c518] to-black" />

      {/* header: icon + title (+ price on mobile) */}
      <div className="flex items-start gap-3 sm:block">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-[#f5c518] sm:h-12 sm:w-12 sm:rounded-2xl">
          <ServiceIcon name={s.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold leading-snug text-black sm:mt-4 sm:text-lg">{s.title}</h3>
          <p className="urdu text-xs text-slate-500 sm:text-sm">{s.urdu}</p>
        </div>
        <p className="shrink-0 text-right text-base font-black text-black sm:hidden">
          {s.price != null ? formatPKR(s.price) : <span className="text-xs">On work basis</span>}
        </p>
      </div>

      <p className="mt-2 hidden flex-1 text-sm text-slate-600 sm:block">{s.desc}</p>

      {/* mobile: details link + Add in one row */}
      <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
        <Link href={`/services/${s.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
          Details <ArrowRight className="h-4 w-4" />
        </Link>
        {s.price != null ? <AddToCartButton slug={s.slug} compact /> : quote}
      </div>

      {/* desktop */}
      <Link
        href={`/services/${s.slug}`}
        className="mt-3 hidden items-center gap-1 text-sm font-semibold text-black underline-offset-4 hover:underline sm:inline-flex"
      >
        Details &amp; documents <ArrowRight className="h-4 w-4" />
      </Link>
      <div className="mt-4 hidden border-t border-black/10 pt-4 sm:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Service fee</p>
        {s.price != null ? (
          <>
            <p className="text-2xl font-black text-black">{formatPKR(s.price)}</p>
            <AddToCartButton slug={s.slug} />
          </>
        ) : (
          <>
            <p className="text-lg font-black text-black">On work basis</p>
            <a
              href={quoteLink(s)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-[#f5c518] hover:bg-neutral-800"
            >
              <MessageCircle className="h-4 w-4" /> Get a Quote
            </a>
          </>
        )}
      </div>
    </div>
  );
}

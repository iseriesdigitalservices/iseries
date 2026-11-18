import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

/** Reads a page number from search params (1-based, safe). */
export function pageFrom(value: string | undefined, total: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const n = Number(value);
  const page = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), pages) : 1;
  return { page, pages, skip: (page - 1) * size, size };
}

/** Slices an in-memory list for the current page. */
export function paginate<T>(rows: T[], value: string | undefined, size = PAGE_SIZE) {
  const { page, pages, skip } = pageFrom(value, rows.length, size);
  return { items: rows.slice(skip, skip + size), page, pages, total: rows.length, skip, size };
}

type Props = {
  /** Path without query, e.g. "/admin/users" */
  basePath: string;
  /** Other query values to keep (search, filters, other sections' pages) */
  params?: Record<string, string | number | undefined>;
  /** Query key for this list's page number, e.g. "page" or "act" */
  param?: string;
  page: number;
  pages: number;
  total: number;
  size?: number;
  label?: string;
  /** Anchor to jump to, e.g. "activity" */
  hash?: string;
};

export default function Pager({ basePath, params = {}, param = "page", page, pages, total, size = PAGE_SIZE, label = "items", hash }: Props) {
  if (total === 0) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
    if (p > 1) q.set(param, String(p));
    else q.delete(param);
    const s = q.toString();
    return `${basePath}${s ? `?${s}` : ""}${hash ? `#${hash}` : ""}`;
  };
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  // small window of page numbers around the current page
  const start = Math.max(1, Math.min(page - 1, pages - 2));
  const numbers = [start, start + 1, start + 2].filter((n) => n >= 1 && n <= pages);

  const box = "flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl px-3 text-sm font-semibold";

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4" aria-label="Pagination">
      <p className="text-xs text-slate-500">
        Showing <b>{from}–{to}</b> of <b>{total}</b> {label}
      </p>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={href(page - 1)} className={`${box} bg-white ring-1 ring-slate-300 hover:bg-slate-100`} rel="prev">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <span className={`${box} cursor-not-allowed bg-white text-slate-400 ring-1 ring-slate-200`}>
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
          </span>
        )}

        {numbers.map((n) =>
          n === page ? (
            <span key={n} className={`${box} bg-black text-[#f5c518]`} aria-current="page">
              {n}
            </span>
          ) : (
            <Link key={n} href={href(n)} className={`${box} bg-white ring-1 ring-slate-300 hover:bg-slate-100`}>
              {n}
            </Link>
          ),
        )}
        {pages > 3 && numbers[numbers.length - 1] < pages && <span className="px-1 text-sm text-slate-400">of {pages}</span>}

        {page < pages ? (
          <Link href={href(page + 1)} className={`${box} bg-black text-[#f5c518] hover:bg-neutral-800`} rel="next">
            <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${box} cursor-not-allowed bg-white text-slate-400 ring-1 ring-slate-200`}>
            <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

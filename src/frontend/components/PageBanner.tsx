import type { ReactNode } from "react";

export default function PageBanner({ eyebrow, title, urdu, children }: { eyebrow: string; title: string; urdu?: string; children?: ReactNode }) {
  return (
    <section className="bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-gold">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">{title}</h1>
        {urdu && <p className="urdu mt-2 text-xl text-gold">{urdu}</p>}
        {children}
      </div>
    </section>
  );
}

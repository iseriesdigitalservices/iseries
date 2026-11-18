"use client";

import { ChevronDown } from "lucide-react";
import { useFaqs } from "@/frontend/SiteProvider";

export default function FaqList() {
  const faqs = useFaqs();
  return (
    <div className="space-y-3">
      {faqs.map((f) => (
        <details key={f.q} className="group rounded-2xl border border-black/10 bg-white p-5 open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-black">
            {f.q}
            <ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

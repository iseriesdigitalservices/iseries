"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

export default function CopyLink({ link, code }: { link: string; code: string }) {
  const [ok, setOk] = useState(false);
  const copy = (t: string) => {
    navigator.clipboard?.writeText(t);
    setOk(true);
    setTimeout(() => setOk(false), 1600);
  };
  const share = `https://wa.me/?text=${encodeURIComponent(`Hello! I Series Digital Services helps with Passport, CNIC, ECL, PCL and other document services. Create your account with my link: ${link}`)}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl bg-white/10 p-1 pl-4 ring-1 ring-white/20">
        <span className="min-w-0 flex-1 truncate text-sm text-white">{link}</span>
        <button onClick={() => copy(link)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#f5c518] px-4 py-2.5 text-sm font-bold text-black">
          {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {ok ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={share} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-bold text-white">
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </a>
        <button onClick={() => copy(code)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20">
          Copy code only
        </button>
      </div>
    </div>
  );
}

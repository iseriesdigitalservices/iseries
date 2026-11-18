"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f4ef] px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="I Series Digital Services" className="mb-6 h-16 w-auto dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="" aria-hidden className="mb-6 hidden h-16 w-auto dark:block" />
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <h1 className="mt-4 text-2xl font-black">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        We could not load this page right now. Please try again in a moment — if it keeps happening, contact us and we will help you straight away.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-semibold text-[#f5c518]">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="rounded-full bg-white px-6 py-3 font-semibold ring-1 ring-black/15">Go to home</Link>
        <Link href="/contact" className="rounded-full bg-white px-6 py-3 font-semibold ring-1 ring-black/15">Contact us</Link>
      </div>
    </main>
  );
}

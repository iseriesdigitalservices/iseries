"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatPKR } from "@/shared/site";

/** Sticky bottom bar: shows cart total and a one-tap checkout on every public page. */
export default function CartBar() {
  const { items, total, ready } = useCart();
  const path = usePathname();
  const hidden = path.startsWith("/admin") || path.startsWith("/cart") || path.startsWith("/checkout");
  if (!ready || items.length === 0 || hidden) return null;
  return (
    <>
      <div className="h-20" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black px-3 py-3 shadow-[0_-8px_30px_rgba(0,0,0,.35)] sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/cart" className="flex min-w-0 items-center gap-3 text-white">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f5c518] px-1 text-xs font-black text-black">{items.length}</span>
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs text-slate-300">{items.length} service{items.length > 1 ? "s" : ""} in cart</span>
              <span className="block truncate text-base font-black text-[#f5c518]">{formatPKR(total)}</span>
            </span>
          </Link>
          <Link href="/checkout" className="flex shrink-0 items-center gap-2 rounded-full bg-[#f5c518] px-5 py-3 text-sm font-black text-black active:scale-95">
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

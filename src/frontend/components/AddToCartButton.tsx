"use client";

import Link from "next/link";
import { Check, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";

export default function AddToCartButton({ slug, large = false, compact = false }: { slug: string; large?: boolean; compact?: boolean }) {
  const { has, add, ready } = useCart();
  const inCart = ready && has(slug);

  if (compact) {
    return inCart ? (
      <Link href="/cart" className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-4 py-2.5 text-sm font-bold text-green-800 ring-1 ring-green-300">
        <Check className="h-4 w-4" /> In cart
      </Link>
    ) : (
      <button onClick={() => add(slug)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-[#f5c518] active:scale-95">
        <Plus className="h-4 w-4" /> Add
      </button>
    );
  }

  const size = large ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm";
  if (inCart) {
    return (
      <Link href="/cart" className={`mt-5 flex items-center justify-center gap-2 rounded-xl bg-green-50 font-semibold text-green-700 ring-1 ring-green-200 ${size}`}>
        <Check className="h-4 w-4" /> In cart — View cart
      </Link>
    );
  }
  return (
    <button onClick={() => add(slug)} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-black font-semibold text-[#f5c518] shadow transition hover:bg-neutral-800 ${size}`}>
      <ShoppingCart className="h-4 w-4" /> Add to Cart
    </button>
  );
}

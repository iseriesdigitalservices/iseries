"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import { useCart } from "@/frontend/components/CartProvider";
import { PRICES, SERVICES, formatPKR, getService } from "@/shared/site";

export default function CartPage() {
  const { items, remove, add, total, ready } = useCart();
  const others = SERVICES.filter((s) => PRICES[s.slug] != null && !items.includes(s.slug));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-black">
          <ShoppingCart className="h-8 w-8 text-black" /> Your Cart
        </h1>

        {!ready ? null : items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-700">Your cart is empty.</p>
            <Link href="/#services" className="mt-5 inline-block rounded-full bg-black px-6 py-3 font-semibold text-gold hover:bg-neutral-800">
              Browse services
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map((slug) => {
                const s = getService(slug);
                if (!s) return null;
                return (
                  <div key={slug} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
                    <div>
                      <p className="font-bold text-black">{s.title}</p>
                      <p className="urdu text-sm text-slate-500">{s.urdu}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="whitespace-nowrap font-bold text-black">{formatPKR(PRICES[slug] ?? 0)}</span>
                      <button
                        onClick={() => remove(slug)}
                        aria-label="Remove"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {others.length > 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-5">
                  <p className="text-sm font-semibold text-slate-600">Add more services</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {others.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => add(s.slug)}
                        className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-green-50 hover:ring-green-500"
                      >
                        + {s.title} · {formatPKR(PRICES[s.slug] ?? 0)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black">Order Summary</h2>
              <div className="mt-4 flex justify-between text-sm text-slate-600">
                <span>Services ({items.length})</span>
                <span>{formatPKR(total)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-extrabold text-black">
                <span>Total</span>
                <span>{formatPKR(total)}</span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 font-semibold text-gold shadow-lg hover:bg-neutral-800"
              >
                Proceed to Checkout <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-3 text-center text-xs text-slate-500">
                You will get the payment account details at checkout. Upload your slip after paying.
              </p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

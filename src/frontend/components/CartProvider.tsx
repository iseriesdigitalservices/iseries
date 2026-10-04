"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRICES } from "@/shared/site";

type CartCtx = {
  items: string[];
  ready: boolean;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "po_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(raw)) setItems(raw.filter((s) => typeof s === "string" && PRICES[s] != null));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((slug: string) => setItems((p) => (p.includes(slug) ? p : [...p, slug])), []);
  const remove = useCallback((slug: string) => setItems((p) => p.filter((s) => s !== slug)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      add,
      remove,
      clear,
      has: (s) => items.includes(s),
      total: items.reduce((sum, s) => sum + (PRICES[s] ?? 0), 0),
    }),
    [items, ready, add, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

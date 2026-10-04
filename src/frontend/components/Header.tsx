"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Menu, Phone, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "./CartProvider";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { SITE } from "@/shared/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/#process", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<{ name: string } | null | undefined>(undefined);
  const { items, ready } = useCart();
  const path = usePathname();
  const count = ready ? items.length : 0;

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMe(j.user ?? null))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => setOpen(false), [path]);

  const active = (href: string) => (href === "/" ? path === "/" : !href.includes("#") && path.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f6f4ef]/95 backdrop-blur">
      <div className="hidden bg-black text-xs text-slate-200 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
          <span>{SITE.tagline}</span>
          <span className="flex items-center gap-4">
            {SITE.phones.map((p) => (
              <a key={p.intl} href={`tel:+${p.intl}`} className="flex items-center gap-1.5 hover:text-gold">
                <Phone className="h-3 w-3" /> {p.display}
              </a>
            ))}
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-2.5">
        <Logo className="h-9 w-auto sm:h-11" />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                active(l.href) ? "bg-black text-gold" : "text-slate-800 hover:bg-black/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="!h-9 !w-9 sm:!h-10 sm:!w-10" />
          <Link
            href={me ? "/account" : "/login"}
            aria-label={me ? "My account" : "Login"}
            className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-black ring-1 ring-black/15 hover:bg-black/5 sm:h-10 sm:px-3.5"
          >
            <User className="h-4 w-4" />
            <span className="hidden max-w-[110px] truncate md:inline">{me ? me.name.split(" ")[0] : "Login"}</span>
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-9 items-center gap-2 rounded-full bg-black px-3 text-sm font-semibold text-gold hover:bg-neutral-800 sm:h-10 sm:px-4"
          >
            <ShoppingCart className="h-4 w-4" /> <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-black">
                {count}
              </span>
            )}
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-black/10 bg-[#f6f4ef] px-4 pb-5 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`block border-b border-black/5 py-3.5 text-sm font-semibold ${active(l.href) ? "text-black" : "text-slate-700"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href={me ? "/account" : "/register"} className="flex items-center gap-2 border-b border-black/5 py-3.5 text-sm font-semibold">
            <Gift className="h-4 w-4" /> Refer &amp; Earn 10%
          </Link>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SITE.phones.map((p) => (
              <a key={p.intl} href={`tel:+${p.intl}`} className="rounded-xl bg-black py-2.5 text-center text-sm font-semibold text-gold">
                {p.display}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

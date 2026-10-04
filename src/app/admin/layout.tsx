import type { ReactNode } from "react";
import Link from "next/link";
import { isAdmin } from "@/backend/admin";
import AdminLogin from "@/frontend/components/AdminLogin";
import AdminForm from "@/frontend/components/AdminForm";
import ThemeToggle from "@/frontend/components/ThemeToggle";
import { LogoMark } from "@/frontend/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — I Series Digital Services", robots: { index: false, follow: false } };

const nav = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/payments", label: "Payment Accounts" },
  { href: "/admin/emails", label: "Notifications" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <div className="min-h-[100dvh] bg-slate-100">
      <header className="sticky top-0 z-40 bg-[#0a0a0a] text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark dark className="h-8 w-auto sm:h-9" />
            <span className="rounded bg-[#f5c518] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">Admin</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <ThemeToggle className="!h-9 !w-9 !bg-white/10 !text-[#f5c518] hover:!bg-white/20" />
            <Link href="/" title="Opening the website ends your admin session" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">
              Website
            </Link>
            <AdminForm action="logout" redirectTo="/admin" inline>
              <button className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">Logout</button>
            </AdminForm>
          </div>
        </div>
        <nav className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1.5 text-sm sm:px-5">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full px-4 py-2 font-medium text-slate-200 hover:bg-white/10 hover:text-[#f5c518]">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl p-3 sm:p-6">{children}</div>
    </div>
  );
}

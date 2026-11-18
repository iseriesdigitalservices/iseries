import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "./Logo";
import ThemeToggle from "./ThemeToggle";

/** Clean page for login / register / password reset: no navbar and no footer. */
export default function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f6f4ef]">
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-black">
          <ArrowLeft className="h-4 w-4" /> Back to website
        </Link>
        <ThemeToggle />
      </div>
      <main className="flex flex-1 flex-col items-center px-4 pb-10">
        <Link href="/" aria-label="Home" className="mb-6 mt-2">
          <LogoMark className="h-16 w-auto sm:h-20" />
        </Link>
        <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"}`}>{children}</div>
      </main>
    </div>
  );
}

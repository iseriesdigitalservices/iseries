import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/frontend/components/CartProvider";
import CartBar from "@/frontend/components/CartBar";

export const viewport = { width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "I Series Digital Services — Passport, CNIC, ECL, NADRA & Document Services",
  description:
    "Professional digital document services for Pakistanis worldwide: passport, CNIC unblock, ECL removal, FIR, CRO, degree attestation, LAT/GAT, NADRA & FRC.",
};

const themeInit = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik+Wet+Paint&family=Inter:wght@400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <CartProvider>
          {children}
          <CartBar />
        </CartProvider>
      </body>
    </html>
  );
}

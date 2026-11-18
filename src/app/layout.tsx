import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getPublicConfig, getSite } from "@/backend/config";
import { SiteProvider } from "@/frontend/SiteProvider";
import { CartProvider } from "@/frontend/components/CartProvider";
import CartBar from "@/frontend/components/CartBar";

export const viewport = { width: "device-width", initialScale: 1 };

/** Title / description follow whatever the admin saved in Website Settings. */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: {
      default: `${site.name} — Passport, CNIC, ECL, NADRA & Document Services`,
      template: `%s | ${site.name}`,
    },
    description: `${site.tagline}. ${site.heroText}`.slice(0, 300),
    icons: site.hasLogoLight && site.logoVersion ? { icon: `/api/branding/light?v=${site.logoVersion}` } : undefined,
    openGraph: { title: site.name, description: site.tagline, type: "website" },
  };
}

const themeInit = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const config = await getPublicConfig();
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
        <SiteProvider config={config}>
          <CartProvider>
            {children}
            <CartBar />
          </CartProvider>
        </SiteProvider>
      </body>
    </html>
  );
}

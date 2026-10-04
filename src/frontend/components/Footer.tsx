import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { LogoMark } from "./Logo";
import { SERVICES, SITE } from "@/shared/site";

export default function Footer() {
  return (
    <>
      <footer className="bg-[#0a0a0a] text-slate-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <LogoMark dark className="h-20 w-auto" />
            <p className="mt-4 text-sm leading-relaxed">
              Professional digital document services for Pakistanis worldwide. Your documents, your rights, our priority.
            </p>
            <p className="urdu mt-2 text-lg text-gold">آپ کا اعتماد ہماری کامیابی ہے</p>
          </div>
          <div>
            <h3 className="font-bold text-white">Services</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="hover:text-gold">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white">Quick links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["/", "Home"],
                ["/services", "All Services"],
                ["/cart", "My Cart"],
                ["/track", "Track Order"],
                ["/faq", "FAQ"],
                ["/contact", "Contact Us"],
                ["/login", "Login / Register"],
              ].map(([h, l]) => (
                <li key={h}>
                  <Link href={h} className="hover:text-gold">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {SITE.phones.map((p) => (
                <li key={p.intl}>
                  <a href={`tel:+${p.intl}`} className="flex items-center gap-2 hover:text-gold">
                    <Phone className="h-4 w-4 text-gold" /> {p.display}
                  </a>
                </li>
              ))}
              <li>
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold">
                  <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp chat
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 break-all hover:text-gold">
                  <Mail className="h-4 w-4 shrink-0 text-gold" /> {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-6 text-center text-xs leading-relaxed sm:px-6">
            Disclaimer: {SITE.name} is a private document facilitation and guidance service and is not a government body.
            Final decisions rest with the relevant government departments. © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </footer>
      <a
        href={`https://wa.me/${SITE.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-24 right-4 z-30 sm:bottom-5 sm:right-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-110"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </>
  );
}

import { Mail, MessageCircle, Phone } from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import PageBanner from "@/frontend/components/PageBanner";
import ContactForm from "@/frontend/components/ContactForm";
import { SITE } from "@/shared/site";

export const metadata = { title: "Contact Us — I Series Digital Services" };

export default function ContactPage() {
  return (
    <div>
      <Header />
      <PageBanner eyebrow="Contact Us" title="Get your free consultation" urdu="ویزہ نہیں، رہنمائی، اعتماد اور حل!" />
      <section className="bg-[#f6f4ef] py-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="space-y-4">
            {SITE.phones.map((ph) => (
              <div key={ph.intl} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <span className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-gold">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs text-slate-500">Call / WhatsApp</span>
                    <span className="text-lg font-extrabold">{ph.display}</span>
                  </span>
                </span>
                <span className="flex gap-2 text-sm font-semibold">
                  <a href={`tel:+${ph.intl}`} className="rounded-full bg-black px-4 py-2 text-gold">Call</a>
                  <a href={`https://wa.me/${ph.intl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-green-500 px-4 py-2 text-white">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </span>
              </div>
            ))}
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-gold">
                <Mail className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-slate-500">Email</span>
                <span className="break-all text-lg font-extrabold">{SITE.email}</span>
              </span>
            </a>
            <p className="rounded-2xl bg-black p-5 text-sm text-slate-300">
              <b className="text-gold">Office hours:</b> We are reachable on WhatsApp 24/7. Calls are answered daily from morning to late evening (Pakistan time).
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
      <Footer />
    </div>
  );
}

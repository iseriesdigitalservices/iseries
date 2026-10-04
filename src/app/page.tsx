import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  FileText,
  Globe2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Gift,
  UserPlus,
  Wallet,
} from "lucide-react";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import ContactForm from "@/frontend/components/ContactForm";
import FaqList from "@/frontend/components/FaqList";
import ServiceCard, { ServiceIcon } from "@/frontend/components/ServiceCard";
import { LogoMark } from "@/frontend/components/Logo";
import { PRICES, REFERRAL_RATE, SERVICES, SITE, formatPKR, getService } from "@/shared/site";

const WHY = [
  { icon: BadgeCheck, title: "Trusted & Reliable", urdu: "معتبر اور قابل اعتماد", text: "Years of experience helping overseas Pakistanis." },
  { icon: FileText, title: "Expert Guidance", urdu: "ماہر افراد کی رہنمائی", text: "Step-by-step help from specialists who know the process." },
  { icon: Clock, title: "Fast Process", urdu: "تیز رفتار کارروائی", text: "Quick response and regular status updates." },
  { icon: Globe2, title: "Worldwide Support", urdu: "دنیا بھر میں مدد", text: "Serving Pakistanis in the Gulf, Europe, UK, USA & more." },
  { icon: Lock, title: "100% Confidential", urdu: "مکمل رازداری", text: "Your documents and data stay strictly private." },
];

const STEPS = [
  { n: "01", title: "Add to Cart", text: "Choose the service(s) you need and add them to your cart." },
  { n: "02", title: "Pay by Bank Transfer", text: "Send the payment to our bank account and upload your payment slip." },
  { n: "03", title: "Admin Verification", text: "Our team checks your slip and approves the payment." },
  { n: "04", title: "Service Delivered", text: "We work on your case and deliver the result — track it online anytime." },
];

const FEATURED = ["passport", "cnic", "ecl"];

export default function Home() {
  return (
    <div id="top">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a0a0a] text-white">
        <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <LogoMark dark className="h-24 w-auto sm:h-32" />
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest ring-1 ring-white/25 sm:text-xs">
              🇵🇰 Stay connected with your homeland
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">
              Unblocking <span className="text-gold">&amp; Exit Support</span>
            </h1>
            <p className="urdu mt-3 text-2xl font-semibold text-gold sm:text-3xl">اب سفر میں کوئی رکاوٹ نہیں!</p>
            <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
              Passport, CNIC, ECL, PCL, FIR, CRO, degrees, NADRA &amp; more — professional guidance, trust and solutions for
              Pakistanis living anywhere in the world.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 font-bold text-black shadow-lg transition hover:brightness-95"
              >
                Order a Service <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 font-semibold hover:bg-white/10"
              >
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-3 text-center">
              {[
                [`${SERVICES.length}`, "Services"],
                ["24/7", "Support"],
                ["100%", "Confidential"],
              ].map(([a, b]) => (
                <div key={b} className="rounded-2xl bg-white/10 px-3 py-4 ring-1 ring-white/15">
                  <div className="text-2xl font-black text-gold">{a}</div>
                  <div className="text-xs text-slate-200">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {FEATURED.map((slug) => {
              const s = getService(slug)!;
              return (
                <Link
                  key={slug}
                  href={`/services/${slug}`}
                  className="flex items-center gap-4 rounded-2xl border-l-4 border-gold bg-white p-4 text-black shadow-xl transition hover:-translate-y-0.5 sm:p-5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-gold sm:h-14 sm:w-14">
                    <ServiceIcon name={s.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-extrabold uppercase leading-tight sm:text-lg">{s.title}</span>
                    <span className="urdu block text-sm text-slate-600">{s.urdu}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm font-black">{PRICES[slug] != null ? formatPKR(PRICES[slug]!) : ""}</span>
                </Link>
              );
            })}
            <Link href="/services" className="text-center text-sm font-semibold text-gold hover:underline">
              View all {SERVICES.length} services →
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="bg-[#f6f4ef] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Our Services</p>
            <h2 className="mt-2 text-3xl font-black text-black sm:text-4xl">A wide range of professional digital services</h2>
            <p className="urdu mt-2 text-lg text-slate-600">آپ کی شناخت، ہمارا فرض</p>
          </div>
          <div className="mt-10 grid gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} s={s} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Why Choose Us</p>
            <h2 className="mt-2 text-3xl font-black text-black sm:text-4xl">ہماری سروسز کیوں؟</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {WHY.map(({ icon: I, title, urdu, text }) => (
              <div key={title} className="rounded-3xl bg-[#f6f4ef] p-6 text-center ring-1 ring-black/10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-gold">
                  <I className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-extrabold text-black">{title}</h3>
                <p className="urdu text-sm text-slate-500">{urdu}</p>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl bg-black px-6 py-5 text-center text-gold">
            <p className="urdu text-2xl font-bold">آپ کا اعتماد ہماری کامیابی ہے</p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="scroll-mt-24 bg-[#0a0a0a] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gold">How It Works</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Simple 4-step process</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                <div className="text-4xl font-black text-gold">{s.n}</div>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/track" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              <ShieldCheck className="h-4 w-4" /> Track an existing order
            </Link>
          </div>
        </div>
      </section>

      {/* REFER & EARN */}
      <section id="refer" className="bg-[#f6f4ef] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-black to-neutral-800 p-6 text-white shadow-2xl sm:p-10">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gold">
              <Gift className="h-4 w-4" /> Refer &amp; Earn
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Bring your friends and earn {REFERRAL_RATE * 100}% on every order</h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Create a free account and share your referral link. Whenever someone new orders through your link and the payment is approved, {REFERRAL_RATE * 100}% is yours. The more new people you bring, the more profit you make.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { i: UserPlus, t: "1. Create an account", d: "Register and get your personal referral link and code." },
                { i: Gift, t: "2. Share your link", d: "New customers sign up with your link and place their orders." },
                { i: Wallet, t: `3. ${REFERRAL_RATE * 100}% payein`, d: "As soon as the payment is approved the commission shows in your profile and the admin deposits it to you." },
              ].map(({ i: I, t: title, d }) => (
                <div key={title} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
                  <I className="h-7 w-7 text-gold" />
                  <p className="mt-3 font-bold">{title}</p>
                  <p className="mt-1 text-sm text-slate-300">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="rounded-full bg-gold px-7 py-3.5 text-center font-bold text-black">Create free account</Link>
              <Link href="/login" className="rounded-full border border-white/40 px-7 py-3.5 text-center font-semibold hover:bg-white/10">Log in to my profile</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">FAQ</p>
            <h2 className="mt-2 text-3xl font-black text-black sm:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="mt-10">
            <FaqList />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-24 bg-gradient-to-br from-black to-neutral-800 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-gold">Contact Us</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Get your free consultation today</h2>
            <p className="urdu mt-2 text-xl text-gold">ویزہ نہیں، رہنمائی، اعتماد اور حل!</p>
            <p className="mt-4 max-w-md text-slate-300">
              Fill in the form and our team will contact you on WhatsApp or phone, usually within a few hours.
            </p>
            <div className="mt-8 space-y-3">
              {SITE.phones.map((ph) => (
                <div key={ph.intl} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <span className="flex items-center gap-4">
                    <Phone className="h-6 w-6 text-gold" />
                    <span>
                      <span className="block text-xs text-slate-300">Call / WhatsApp</span>
                      <span className="font-semibold">{ph.display}</span>
                    </span>
                  </span>
                  <span className="flex gap-2 text-xs font-semibold">
                    <a href={`tel:+${ph.intl}`} className="rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25">Call</a>
                    <a href={`https://wa.me/${ph.intl}`} target="_blank" rel="noreferrer" className="rounded-full bg-gold px-3 py-1.5 text-black hover:brightness-95">WhatsApp</a>
                  </span>
                </div>
              ))}
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 hover:bg-white/15">
                <Mail className="h-6 w-6 shrink-0 text-gold" />
                <span className="min-w-0">
                  <span className="block text-xs text-slate-300">Email</span>
                  <span className="break-all font-semibold">{SITE.email}</span>
                </span>
              </a>
            </div>
          </div>
          <div className="text-slate-900">
            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

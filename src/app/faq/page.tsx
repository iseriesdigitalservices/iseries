import Link from "next/link";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import PageBanner from "@/frontend/components/PageBanner";
import FaqList from "@/frontend/components/FaqList";

export const metadata = { title: "FAQ — I Series Digital Services" };

export default function FaqPage() {
  return (
    <div>
      <Header />
      <PageBanner eyebrow="FAQ" title="Frequently asked questions" urdu="اکثر پوچھے جانے والے سوالات" />
      <section className="bg-[#f6f4ef] py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FaqList />
          <p className="mt-8 text-center text-sm text-slate-600">
            Still have a question? <Link href="/contact" className="font-semibold text-black underline">Contact us</Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

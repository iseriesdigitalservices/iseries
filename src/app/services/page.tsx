import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import PageBanner from "@/frontend/components/PageBanner";
import ServiceCard from "@/frontend/components/ServiceCard";
import { SERVICES } from "@/shared/site";

export const metadata = { title: "All Services & Prices — I Series Digital Services" };

export default function ServicesPage() {
  return (
    <div>
      <Header />
      <PageBanner eyebrow="Our Services" title="All services & prices" urdu="آپ کی شناخت، ہمارا فرض">
        <p className="mt-3 max-w-2xl text-slate-300">
          Choose the service you need, add it to your cart and pay by bank transfer. Our team verifies your payment and starts working on your case.
        </p>
      </PageBanner>
      <section className="bg-[#f6f4ef] py-14">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:gap-6 sm:px-6 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICES.map((s) => (
            <ServiceCard key={s.slug} s={s} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}

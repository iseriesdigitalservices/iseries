import Link from "next/link";
import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";

export default function NotFound() {
  return (
    <div>
      <Header />
      <main className="flex min-h-[55vh] flex-col items-center justify-center bg-[#f6f4ef] px-4 text-center">
        <p className="text-7xl font-black text-black">404</p>
        <p className="mt-3 text-lg font-semibold">This page could not be found.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="rounded-full bg-black px-6 py-3 font-semibold text-gold">Home</Link>
          <Link href="/services" className="rounded-full bg-white px-6 py-3 font-semibold ring-1 ring-black/15">Services</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

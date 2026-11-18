import Header from "@/frontend/components/Header";
import Footer from "@/frontend/components/Footer";
import CheckoutForm from "@/frontend/components/CheckoutForm";
import { redirect } from "next/navigation";
import { getPaymentMethods } from "@/backend/admin";
import { getCurrentUser } from "@/backend/auth";
import { hex } from "@/backend/mongo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout — I Series Digital Services" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const methods = (await getPaymentMethods(true)).map((m) => ({
    id: hex(m._id),
    kind: m.kind,
    accountTitle: m.accountTitle,
    accountNumber: m.accountNumber,
    bankName: m.bankName,
    iban: m.iban,
  }));
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-black">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">
          1) Your details & documents → 2) Pay by bank transfer → 3) Upload your payment slip and submit.
        </p>
        <CheckoutForm methods={methods} user={{ name: user.name, email: user.email, phone: user.phone, country: user.country ?? "" }} />
      </main>
      <Footer />
    </div>
  );
}

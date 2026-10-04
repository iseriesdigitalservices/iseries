import { redirect } from "next/navigation";
import AuthShell from "@/frontend/components/AuthShell";
import ForgotForm from "@/frontend/components/ForgotForm";
import { getCurrentUser } from "@/backend/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password — I Series Digital Services", robots: { index: false } };

export default async function ForgotPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <AuthShell>
      <ForgotForm />
    </AuthShell>
  );
}

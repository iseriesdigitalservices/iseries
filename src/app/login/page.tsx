import { redirect } from "next/navigation";
import AuthShell from "@/frontend/components/AuthShell";
import AuthForm from "@/frontend/components/AuthForm";
import { getCurrentUser, safeNext } from "@/backend/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in — I Series Digital Services", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell>
      <AuthForm mode="login" next={next} refCode="" />
    </AuthShell>
  );
}

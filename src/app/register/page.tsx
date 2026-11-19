import { redirect } from "next/navigation";
import AuthShell from "@/frontend/components/AuthShell";
import AuthForm from "@/frontend/components/AuthForm";
import { getCurrentUser, safeNext } from "@/backend/auth";
<<<<<<< HEAD
import { getSite } from "@/backend/config";
import { pct } from "@/shared/site";
=======
import { REFERRAL_RATE } from "@/shared/site";
>>>>>>> origin/main

export const dynamic = "force-dynamic";
export const metadata = { title: "Create Account — I Series Digital Services", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; ref?: string }> }) {
  const sp = await searchParams;
<<<<<<< HEAD
  const REFERRAL_RATE = (await getSite()).referralRate;
=======
>>>>>>> origin/main
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  const ref = (sp.ref || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  return (
    <AuthShell wide>
      {ref && (
        <p className="mb-4 rounded-2xl bg-black p-4 text-center text-sm text-[#f5c518]">
          🎁 You were invited with referral code <b className="tracking-widest">{ref}</b>.
        </p>
      )}
      <AuthForm mode="register" next={next} refCode={ref} />
      <p className="mt-5 text-center text-xs text-slate-500">
<<<<<<< HEAD
        Refer &amp; Earn: bring your friends and earn {pct(REFERRAL_RATE)}% on every approved order they place.
=======
        Refer &amp; Earn: bring your friends and earn {REFERRAL_RATE * 100}% on every approved order they place.
>>>>>>> origin/main
      </p>
    </AuthShell>
  );
}

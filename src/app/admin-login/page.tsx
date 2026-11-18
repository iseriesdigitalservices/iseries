import AdminLogin from "@/frontend/components/AdminLogin";
import { needsSetup } from "@/backend/adminAuth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };

/** Shown for any /admin URL when there is no admin cookie (the proxy rewrites to this page, so no admin code or data runs). */
export default async function AdminLoginPage() {
  return <AdminLogin setup={await needsSetup()} />;
}

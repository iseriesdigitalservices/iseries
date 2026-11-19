import AdminLogin from "@/frontend/components/AdminLogin";
<<<<<<< HEAD
import { needsSetup } from "@/backend/adminAuth";
=======
>>>>>>> origin/main

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };

/** Shown for any /admin URL when there is no admin cookie (the proxy rewrites to this page, so no admin code or data runs). */
<<<<<<< HEAD
export default async function AdminLoginPage() {
  return <AdminLogin setup={await needsSetup()} />;
=======
export default function AdminLoginPage() {
  return <AdminLogin />;
>>>>>>> origin/main
}

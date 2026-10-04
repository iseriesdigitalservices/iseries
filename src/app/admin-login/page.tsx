import AdminLogin from "@/frontend/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };

/** Shown for any /admin URL when there is no admin cookie (the proxy rewrites to this page, so no admin code or data runs). */
export default function AdminLoginPage() {
  return <AdminLogin />;
}

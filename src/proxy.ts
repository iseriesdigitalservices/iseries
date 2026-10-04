import { NextResponse, type NextRequest } from "next/server";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) CSRF protection: state-changing API calls must come from this same site.
  if (pathname.startsWith("/api/")) {
    if (!SAFE.has(req.method)) {
      const origin = req.headers.get("origin");
      if (origin) {
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
        let same = false;
        try {
          same = new URL(origin).host === host;
        } catch {}
        if (!same) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // 2) /admin without an admin cookie: show only the login page (admin pages and their data never run)
  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && !req.cookies.has("po_admin")) {
    return NextResponse.rewrite(new URL("/admin-login", req.url));
  }

  // 3) The admin session ends the moment the admin leaves the admin panel (opens any public page).
  const token = req.cookies.get("po_admin")?.value;
  if (token && !pathname.startsWith("/admin") && req.method === "GET") {
    const prefetch =
      req.headers.has("next-router-prefetch") ||
      /prefetch/i.test(req.headers.get("purpose") || "") ||
      /prefetch/i.test(req.headers.get("sec-purpose") || "");
    const navigation = req.headers.get("sec-fetch-dest") === "document" || req.headers.has("rsc");
    if (!prefetch && navigation) {
      // Revoke the session on the server right now. Uses this site's own address so it works on any host
      // (local, GoDaddy, Vercel). Bounded wait so a slow call can never block the page.
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "http";
      const base = host ? `${proto}://${host}` : req.nextUrl.origin;
      await Promise.race([
        fetch(`${base}/api/admin/leave`, {
          method: "POST",
          headers: { cookie: `po_admin=${token}`, "x-admin-leave": "1" },
        }).catch(() => null),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
      const res = NextResponse.next();
      const https = (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")) === "https";
      res.cookies.set(
        https && process.env.COOKIE_SAMESITE !== "lax"
          ? { name: "po_admin", value: "", path: "/", maxAge: 0, httpOnly: true, secure: true, sameSite: "none", partitioned: true }
          : { name: "po_admin", value: "", path: "/", maxAge: 0, httpOnly: true, secure: https, sameSite: "lax" },
      );
      return res;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|map|txt|xml|woff2?)$).*)"],
};

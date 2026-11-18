import { NextResponse } from "next/server";
import { ADMIN_COOKIE, revokeAdminSession } from "@/backend/admin";

export const dynamic = "force-dynamic";

/** Called by the proxy when the admin opens a public page: ends the admin session on the server. */
export async function POST(req: Request) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  await revokeAdminSession(m?.[1]);
  return NextResponse.json({ ok: true });
}

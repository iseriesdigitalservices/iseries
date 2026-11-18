import { NextResponse } from "next/server";
import { logActivity } from "@/backend/activity";
import { USER_COOKIE, getCurrentUser } from "@/backend/auth";
import { hex } from "@/backend/mongo";
import { cookieOptions } from "@/backend/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (u) await logActivity(hex(u._id), "logout", null, req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", cookieOptions(req, 0));
  return res;
}

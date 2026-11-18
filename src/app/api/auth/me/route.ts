import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/backend/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  return NextResponse.json({ user: u ? publicUser(u) : null }, { headers: { "Cache-Control": "no-store" } });
}

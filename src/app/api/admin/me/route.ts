import { NextResponse } from "next/server";
import { isAdmin } from "@/backend/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: await isAdmin() });
}

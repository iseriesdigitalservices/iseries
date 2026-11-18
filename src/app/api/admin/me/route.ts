import { NextResponse } from "next/server";
import { currentAdmin, needsSetup } from "@/backend/adminAuth";
import { hex } from "@/backend/mongo";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await currentAdmin();
  return NextResponse.json(
    {
      ok: admin !== null,
      setup: admin ? false : await needsSetup(),
      admin: admin ? { id: hex(admin._id), name: admin.name, email: admin.email, role: admin.role } : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

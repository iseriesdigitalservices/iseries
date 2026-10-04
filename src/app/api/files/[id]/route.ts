import { isAdmin } from "@/backend/admin";
import { getCurrentUser } from "@/backend/auth";
import { cols, hex } from "@/backend/mongo";

export const dynamic = "force-dynamic";

const INLINE = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[\w-]{20,60}$/.test(id)) return new Response("Not found", { status: 404 });
  const { files } = await cols();
  const f = await files.findOne({ _id: id });
  if (!f) return new Response("Not found", { status: 404 });

  // Slips and ID documents: only the admin or the customer who uploaded them. Delivery files use an unguessable id.
  if (f.kind !== "delivery" && !(await isAdmin())) {
    const u = await getCurrentUser();
    if (!u || !f.ownerId || f.ownerId !== hex(u._id)) return new Response("Forbidden", { status: 403 });
  }
  const inline = INLINE.has(f.mime);
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(f.data.buffer), {
    headers: {
      "Content-Type": inline ? f.mime : "application/octet-stream",
      "Content-Disposition": `${inline && !download ? "inline" : "attachment"}; filename="${encodeURIComponent(f.name)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}

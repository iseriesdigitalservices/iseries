import { cols } from "@/backend/mongo";

export const dynamic = "force-dynamic";

/** Serves the logo the admin uploaded (light or dark version). */
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (kind !== "light" && kind !== "dark") return new Response("Not found", { status: 404 });
  const { files } = await cols();
  const f = await files.findOne({ _id: `logo-${kind}` });
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.data.buffer), {
    headers: {
      "Content-Type": f.mime,
      // the URL carries a ?v= marker, so it is safe to cache hard
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

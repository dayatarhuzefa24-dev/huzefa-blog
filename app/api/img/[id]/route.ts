import { prisma } from "@/lib/prisma";

/**
 * Serves images uploaded from the admin panel. Image ids are random and never change,
 * so browsers and Vercel's CDN may cache them for a year.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return new Response("Not found", { status: 404 });

  const img = await prisma.image.findUnique({
    where: { id },
    select: { data: true, contentType: true },
  });
  if (!img) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

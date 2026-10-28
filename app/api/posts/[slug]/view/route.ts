import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

/**
 * Counts one view per visitor per post per 24h (httpOnly cookie dedupe, enforced
 * server-side) and ignores crawlers. Always returns the current total.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const jar = await cookies();
  const ua = (await headers()).get("user-agent") ?? "";
  const key = `viewed_${slug}`;

  try {
    if (!jar.get(key) && !BOT.test(ua)) {
      const post = await prisma.post.update({
        where: { slug },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
      jar.set(key, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 });
      return NextResponse.json({ views: post.views });
    }
    const post = await prisma.post.findUnique({ where: { slug }, select: { views: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ views: post.views });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

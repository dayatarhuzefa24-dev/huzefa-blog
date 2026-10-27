import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Like / unlike. A visitor can like a post once: the httpOnly cookie
 * `liked_<slug>` is the source of truth, so repeated requests can't inflate the count.
 * Body: { "like": true | false }
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await req.json().catch(() => ({}))) as { like?: unknown };
  const want = body.like === true;

  const jar = await cookies();
  const key = `liked_${slug}`;
  const has = jar.get(key)?.value === "1";

  try {
    if (want && !has) {
      const post = await prisma.post.update({ where: { slug }, data: { likes: { increment: 1 } }, select: { likes: true } });
      jar.set(key, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
      return NextResponse.json({ likes: post.likes, liked: true });
    }
    if (!want && has) {
      // updateMany + gt guard keeps the counter from ever going below zero.
      await prisma.post.updateMany({ where: { slug, likes: { gt: 0 } }, data: { likes: { decrement: 1 } } });
      jar.delete(key);
    }
    const post = await prisma.post.findUnique({ where: { slug }, select: { likes: true } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ likes: post.likes, liked: want });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

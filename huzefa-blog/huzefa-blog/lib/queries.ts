import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Lightweight shape used by every card/list — never loads the full article body. */
export const cardSelect = {
  slug: true,
  title: true,
  coverImage: true,
  category: true,
  seoDescription: true,
  publishedAt: true,
  views: true,
  likes: true,
} as const;

/**
 * Only posts the public may see: published, and the publish time has arrived.
 * (Drafts and scheduled posts are excluded everywhere on the public site.)
 */
export function liveWhere(): Prisma.PostWhereInput {
  return { status: "published", publishedAt: { lte: new Date() } };
}

export function getLatest(opts: { take: number; skip?: number; category?: string; excludeSlugs?: string[] }) {
  return prisma.post.findMany({
    where: {
      ...liveWhere(),
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.excludeSlugs?.length ? { slug: { notIn: opts.excludeSlugs } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: opts.take,
    skip: opts.skip,
    select: cardSelect,
  });
}

/** The newest post the author marked as featured (used as the homepage lead story). */
export function getFeatured() {
  return prisma.post.findFirst({
    where: { ...liveWhere(), featured: true },
    orderBy: { publishedAt: "desc" },
    select: cardSelect,
  });
}

export function countPosts(where?: { category?: string; keyword?: string }) {
  return prisma.post.count({
    where: {
      ...liveWhere(),
      ...(where?.category ? { category: where.category } : {}),
      ...(where?.keyword ? { keywords: { has: where.keyword } } : {}),
    },
  });
}

export function getMostRead(take = 5, excludeSlug?: string) {
  return prisma.post.findMany({
    where: { ...liveWhere(), ...(excludeSlug ? { slug: { not: excludeSlug } } : {}) },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take,
    select: cardSelect,
  });
}

export function getRelated(post: { slug: string; category: string }, take = 3) {
  return prisma.post.findMany({
    where: { ...liveWhere(), category: post.category, slug: { not: post.slug } },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

export async function getAdjacent(publishedAt: Date) {
  const live = liveWhere();
  const [newer, older] = await Promise.all([
    prisma.post.findFirst({
      where: { ...live, publishedAt: { gt: publishedAt, lte: new Date() } },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { ...live, publishedAt: { lt: publishedAt } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
  ]);
  return { newer, older };
}

export function getByKeyword(keyword: string, take: number, skip = 0) {
  return prisma.post.findMany({
    where: { ...liveWhere(), keywords: { has: keyword } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: cardSelect,
  });
}

export function searchPosts(q: string, take = 20) {
  const contains = { contains: q, mode: "insensitive" as const };
  return prisma.post.findMany({
    where: { ...liveWhere(), OR: [{ title: contains }, { seoDescription: contains }, { content: contains }] },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

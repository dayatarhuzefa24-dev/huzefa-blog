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

export function getLatest(opts: { take: number; skip?: number; category?: string; excludeSlugs?: string[] }) {
  return prisma.post.findMany({
    where: {
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.excludeSlugs?.length ? { slug: { notIn: opts.excludeSlugs } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: opts.take,
    skip: opts.skip,
    select: cardSelect,
  });
}

export function countPosts(where?: { category?: string; keyword?: string }) {
  return prisma.post.count({
    where: {
      ...(where?.category ? { category: where.category } : {}),
      ...(where?.keyword ? { keywords: { has: where.keyword } } : {}),
    },
  });
}

export function getMostRead(take = 5, excludeSlug?: string) {
  return prisma.post.findMany({
    where: excludeSlug ? { slug: { not: excludeSlug } } : undefined,
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take,
    select: cardSelect,
  });
}

export function getRelated(post: { slug: string; category: string }, take = 3) {
  return prisma.post.findMany({
    where: { category: post.category, slug: { not: post.slug } },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

export async function getAdjacent(publishedAt: Date) {
  const [newer, older] = await Promise.all([
    prisma.post.findFirst({
      where: { publishedAt: { gt: publishedAt } },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { publishedAt: { lt: publishedAt } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
  ]);
  return { newer, older };
}

export function getByKeyword(keyword: string, take: number, skip = 0) {
  return prisma.post.findMany({
    where: { keywords: { has: keyword } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: cardSelect,
  });
}

export function searchPosts(q: string, take = 20) {
  const contains = { contains: q, mode: "insensitive" as const };
  return prisma.post.findMany({
    where: { OR: [{ title: contains }, { seoDescription: contains }, { content: contains }] },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

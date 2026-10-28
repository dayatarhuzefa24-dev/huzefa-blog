import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { liveWhere } from "@/lib/queries";
import { SITE_URL, categoryHref } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, posts] = await Promise.all([
    getCategories(),
    prisma.post.findMany({
      where: liveWhere(), // drafts and scheduled posts are never listed
      orderBy: { publishedAt: "desc" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({ url: `${SITE_URL}${categoryHref(c.name)}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/privacy-policy`, priority: 0.1 },
    { url: `${SITE_URL}/terms-of-service`, priority: 0.1 },
    { url: `${SITE_URL}/contact`, priority: 0.1 },
  ];
}

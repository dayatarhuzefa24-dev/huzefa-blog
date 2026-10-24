import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, SITE_URL, categoryHref } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}${categoryHref(c)}`, changeFrequency: "daily" as const, priority: 0.6 })),
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

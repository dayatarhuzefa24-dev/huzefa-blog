import { prisma } from "@/lib/prisma";
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// RSS 2.0 feed of the 20 newest posts — submit this URL in Google Publisher Center.
export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      slug: true,
      title: true,
      category: true,
      coverImage: true,
      seoDescription: true,
      keywords: true,
      publishedAt: true,
    },
  });

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${p.publishedAt.toUTCString()}</pubDate>
      <dc:creator>${esc(AUTHOR_NAME)}</dc:creator>
      <category>${esc(p.category)}</category>${p.keywords
        .map((k) => `\n      <category>${esc(k)}</category>`)
        .join("")}
      <description>${esc(p.seoDescription)}</description>
      <media:content url="${esc(p.coverImage)}" medium="image" />
    </item>`;
    })
    .join("\n");

  const lastBuildDate = (posts[0]?.publishedAt ?? new Date()).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(SITE_DESCRIPTION)}</description>
    <language>en-in</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}

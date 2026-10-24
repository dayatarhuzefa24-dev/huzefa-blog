import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import AdSlot from "@/components/AdSlot";
import BackToTop from "@/components/BackToTop";
import Breadcrumbs from "@/components/Breadcrumbs";
import LikeButton from "@/components/LikeButton";
import MostRead from "@/components/MostRead";
import PostCard from "@/components/PostCard";
import ReadingProgress from "@/components/ReadingProgress";
import ShareBar from "@/components/ShareBar";
import TableOfContents from "@/components/TableOfContents";
import ViewCounter from "@/components/ViewCounter";
import { extractHeadings, readingTimeMinutes, wordCount } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import { getAdjacent, getMostRead, getRelated } from "@/lib/queries";
import { rehypeAdAfterParagraph } from "@/lib/rehype-ad";
import {
  AUTHOR_BIO,
  AUTHOR_NAME,
  CATEGORIES,
  SITE_NAME,
  SITE_URL,
  categoryHref,
  formatDateTime,
} from "@/lib/site";

// Server-side rendered on every request so new posts and counters are always fresh.
export const dynamic = "force-dynamic";

// De-duplicates the query between generateMetadata and the page render.
const getPost = cache((slug: string) => prisma.post.findUnique({ where: { slug } }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: { absolute: post.seoTitle },
    description: post.seoDescription,
    keywords: post.keywords,
    authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
    alternates: { canonical: url },
    // NOTE: no `robots` key here on purpose — the root layout's
    // "max-image-preview:large" tag is inherited by this page.
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: post.seoTitle,
      description: post.seoDescription,
      images: [{ url: post.coverImage, alt: post.title }],
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [AUTHOR_NAME],
      section: post.category,
      tags: post.keywords,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.seoDescription,
      images: [post.coverImage],
    },
  };
}

/** Escape "<" so JSON inside <script> can never close the tag early (XSS-safe). */
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// Heading ids (for the table of contents) + an ad unit after the 3rd paragraph.
const rehypePlugins: PluggableList = [
  rehypeSlug,
  [rehypeAdAfterParagraph, { after: 3, slot: "in-article-1" }],
];

const mdComponents: Components = {
  a: ({ href, children }) => {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  },
  // The rehype plugin emits <div data-ad-slot="…">; render it as an ad container.
  div: (props) => {
    const slot = (props as Record<string, unknown>)["data-ad-slot"];
    if (typeof slot === "string") {
      return (
        <>
          {/* ADSENSE: in-article unit (after paragraph 3) */}
          <AdSlot slot={slot} />
        </>
      );
    }
    return <div>{props.children}</div>;
  },
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const liked = (await cookies()).get(`liked_${post.slug}`)?.value === "1";

  const [related, mostRead, { newer, older }] = await Promise.all([
    getRelated(post, 3),
    getMostRead(5, post.slug),
    getAdjacent(post.publishedAt),
  ]);

  const headings = extractHeadings(post.content);
  const words = wordCount(post.content);
  const minutes = readingTimeMinutes(post.content);
  const wasUpdated = post.updatedAt.getTime() - post.publishedAt.getTime() > 60_000;

  const articleLd = { ...(post.jsonLd as Record<string, unknown>), wordCount: words };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: post.category, item: `${SITE_URL}${categoryHref(post.category)}` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const isKnownCategory = (CATEGORIES as readonly string[]).includes(post.category);
  const initials = AUTHOR_NAME.split(" ").map((w) => w[0]).join("");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ReadingProgress />

      {/* AI-generated NewsArticle JSON-LD (+ breadcrumbs). Google reads these anywhere in the
          document; the App Router renders them inline with the page's other metadata. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: post.category, href: isKnownCategory ? categoryHref(post.category) : undefined },
          { label: post.title },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <header>
            <Link href={categoryHref(post.category)} className="text-xs font-bold uppercase tracking-wide text-red-600 hover:underline">
              {post.category}
            </Link>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
              {post.title}
            </h1>
            {/* Standfirst / summary */}
            <p className="mt-4 border-l-4 border-red-600 pl-4 text-lg leading-relaxed text-zinc-700">
              {post.seoDescription}
            </p>

            {/* Byline */}
            <div className="mt-5 flex items-center gap-3 border-y border-zinc-200 py-3">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white"
              >
                {initials}
              </span>
              <div className="text-sm">
                <p>
                  By <span className="font-semibold">{AUTHOR_NAME}</span>
                </p>
                <p className="text-zinc-500">
                  Published <time dateTime={post.publishedAt.toISOString()}>{formatDateTime(post.publishedAt)}</time>
                  {wasUpdated && (
                    <>
                      {" "}· Updated <time dateTime={post.updatedAt.toISOString()}>{formatDateTime(post.updatedAt)}</time>
                    </>
                  )}{" "}
                  · {minutes} min read
                </p>
              </div>
            </div>

            {/* Engagement bar */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ViewCounter slug={post.slug} initialViews={post.views} />
              <LikeButton slug={post.slug} initialLikes={post.likes} initiallyLiked={liked} />
              <ShareBar url={url} title={post.title} />
            </div>
          </header>

          <figure className="mt-6 overflow-hidden rounded-lg bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} fetchPriority="high" className="aspect-video w-full object-cover" />
          </figure>

          <TableOfContents headings={headings} />

          {/* ADSENSE: top-of-article unit */}
          <AdSlot slot="article-top" />

          <div id="article-body" className="prose prose-zinc max-w-none lg:prose-lg prose-headings:scroll-mt-28 prose-a:text-red-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins} components={mdComponents}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.keywords.length > 0 && (
            <nav aria-label="Tags" className="mt-8 flex flex-wrap gap-2">
              {post.keywords.map((k) => (
                <Link
                  key={k}
                  href={`/tag/${encodeURIComponent(k)}`}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-red-600 hover:text-white"
                >
                  #{k}
                </Link>
              ))}
            </nav>
          )}

          {/* Closing engagement bar */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg bg-zinc-50 p-4">
            <p className="text-sm font-semibold">Enjoyed this story?</p>
            <LikeButton slug={post.slug} initialLikes={post.likes} initiallyLiked={liked} />
            <ShareBar url={url} title={post.title} />
          </div>

          {/* ADSENSE: end-of-article unit */}
          <AdSlot slot="article-bottom" />

          {/* Author box */}
          <section aria-label="About the author" className="flex gap-4 rounded-lg border border-zinc-200 p-4">
            <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white">
              {initials}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Written by</p>
              <p className="text-lg font-bold">{AUTHOR_NAME}</p>
              <p className="mt-1 text-sm text-zinc-600">{AUTHOR_BIO}</p>
            </div>
          </section>

          {/* Previous / next story */}
          {(newer || older) && (
            <nav aria-label="More stories" className="mt-6 grid gap-3 sm:grid-cols-2">
              {older ? (
                <Link href={`/blog/${older.slug}`} className="rounded-lg border border-zinc-200 p-4 hover:border-red-600">
                  <span className="text-xs font-bold uppercase text-zinc-500">← Previous story</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-semibold">{older.title}</span>
                </Link>
              ) : <span />}
              {newer ? (
                <Link href={`/blog/${newer.slug}`} className="rounded-lg border border-zinc-200 p-4 text-right hover:border-red-600">
                  <span className="text-xs font-bold uppercase text-zinc-500">Next story →</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-semibold">{newer.title}</span>
                </Link>
              ) : <span />}
            </nav>
          )}

          {/* Also read */}
          {related.length > 0 && (
            <section aria-labelledby="also-read" className="mt-10">
              <h2 id="also-read" className="mb-4 border-b-2 border-red-600 pb-2 text-xl font-black uppercase tracking-tight">
                Also read
              </h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside aria-label="Sidebar" className="hidden lg:block">
          <div className="sticky top-28 space-y-8">
            {/* ADSENSE: sidebar unit (300x600 / 300x250) */}
            <AdSlot slot="sidebar" className="my-0" />
            <MostRead posts={mostRead} />
          </div>
        </aside>
      </div>

      <BackToTop />
    </div>
  );
}

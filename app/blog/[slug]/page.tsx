import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import AdSlot from "@/components/AdSlot";
import BackToTop from "@/components/BackToTop";
import CommentSection, { type PublicComment } from "@/components/CommentSection";
import Breadcrumbs from "@/components/Breadcrumbs";
import LikeButton from "@/components/LikeButton";
import MarkdownView from "@/components/MarkdownView";
import MostRead from "@/components/MostRead";
import PostCard from "@/components/PostCard";
import ReadingProgress from "@/components/ReadingProgress";
import ShareBar from "@/components/ShareBar";
import SubscribeForm from "@/components/SubscribeForm";
import TableOfContents from "@/components/TableOfContents";
import ViewCounter from "@/components/ViewCounter";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { extractHeadings, readingTimeMinutes, wordCount } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import { getAdjacent, getMostRead, getRelated } from "@/lib/queries";
import {
  AUTHOR_BIO,
  AUTHOR_NAME,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  categoryHref,
  formatDateTime,
} from "@/lib/site";

// Server-side rendered on every request so new posts and counters are always fresh.
export const dynamic = "force-dynamic";

// De-duplicates the query between generateMetadata and the page render.
const getPost = cache((slug: string) => prisma.post.findUnique({ where: { slug } }));

/** Approved comments only. If the comments table does not exist yet, the page still works. */
async function getComments(postId: string): Promise<PublicComment[]> {
  try {
    return await prisma.comment.findMany({
      where: { postId, status: "approved" },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: { id: true, name: true, body: true, createdAt: true },
    });
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

/** Live = published and its publish time has arrived. Drafts/scheduled posts are admin-only. */
const isLive = (p: { status: string; publishedAt: Date }) => p.status === "published" && p.publishedAt <= new Date();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };

  // Drafts and scheduled posts (only the admin can open them) are never indexed.
  if (!isLive(post)) {
    return { title: `Preview: ${post.title}`, robots: { index: false, follow: false } };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const title = post.seoTitle || post.title;
  const image = absoluteUrl(post.coverImage);
  return {
    title: { absolute: title },
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
      title,
      description: post.seoDescription,
      images: [{ url: image, alt: post.title }],
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [AUTHOR_NAME],
      section: post.category,
      tags: post.keywords,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.seoDescription,
      images: [image],
    },
  };
}

/** Escape "<" so JSON inside <script> can never close the tag early (XSS-safe). */
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const live = isLive(post);
  const admin = await isAdmin();
  if (!live && !admin) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const liked = (await cookies()).get(`liked_${post.slug}`)?.value === "1";

  const [related, mostRead, { newer, older }, categories, comments] = await Promise.all([
    getRelated(post, 3),
    getMostRead(5, post.slug),
    getAdjacent(post.publishedAt),
    getCategories(),
    live ? getComments(post.id) : Promise.resolve([] as PublicComment[]),
  ]);

  const headings = extractHeadings(post.content);
  const words = wordCount(post.content);
  const minutes = readingTimeMinutes(post.content);
  const wasUpdated = post.updatedAt.getTime() - post.publishedAt.getTime() > 60_000;
  const categoryExists = categories.some((c) => c.name === post.category);

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

  const initials = AUTHOR_NAME.split(" ").map((w) => w[0]).join("");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ReadingProgress />

      {/* AI/manual NewsArticle JSON-LD (+ breadcrumbs). Google reads these anywhere in the
          document; the App Router renders them inline with the page's other metadata.
          Not output for drafts or scheduled posts. */}
      {live && (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
        </>
      )}

      {admin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 border-taxi bg-ink p-3 text-sm text-white">
          <span>
            {live
              ? "You are logged in as admin."
              : post.status === "draft"
                ? "Draft preview — only you can see this page."
                : `Scheduled — goes live ${formatDateTime(post.publishedAt)}. Only you can see it until then.`}
          </span>
          <Link href={`/admin/edit/${post.id}`} className="bg-taxi px-3 py-1 font-bold text-ink">
            Edit this post
          </Link>
        </div>
      )}

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: post.category, href: categoryExists ? categoryHref(post.category) : undefined },
          { label: post.title },
        ]}
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <header className="max-w-3xl">
            <p>
              {categoryExists ? (
                <Link href={categoryHref(post.category)} className="inline-flex items-center gap-2 text-base font-bold hover:underline decoration-taxi decoration-2 underline-offset-4">
                  <span aria-hidden className="h-3 w-3 bg-taxi" />
                  {post.category}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 text-base font-bold">
                  <span aria-hidden className="h-3 w-3 bg-taxi" />
                  {post.category}
                </span>
              )}
            </p>
            <h1 className="display mt-3 text-[2.4rem] sm:text-5xl lg:text-[3.6rem]">{post.title}</h1>
            {/* Standfirst / summary */}
            {post.seoDescription && (
              <p className="mt-5 border-l-4 border-taxi pl-4 font-[family-name:var(--font-body)] text-xl leading-relaxed text-muted sm:text-[1.4rem]">
                {post.seoDescription}
              </p>
            )}

            {/* Byline */}
            <div className="mt-6 flex items-center gap-3.5">
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center bg-ink text-base font-extrabold text-taxi">
                {initials}
              </span>
              <div className="text-sm">
                <p>
                  By <span className="font-bold">{AUTHOR_NAME}</span>
                </p>
                <p className="text-muted">
                  <time dateTime={post.publishedAt.toISOString()}>{formatDateTime(post.publishedAt)}</time>
                  {wasUpdated && (
                    <>
                      {" "}(updated <time dateTime={post.updatedAt.toISOString()}>{formatDateTime(post.updatedAt)}</time>)
                    </>
                  )}
                  {", "}{minutes} min read
                </p>
              </div>
            </div>

            {/* Engagement bar */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-3">
              <ViewCounter slug={post.slug} initialViews={post.views} />
              <LikeButton slug={post.slug} initialLikes={post.likes} initiallyLiked={liked} />
              <ShareBar url={url} title={post.title} />
            </div>
          </header>

          {post.coverImage && (
            <figure className="mt-7 overflow-hidden bg-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt={post.title} fetchPriority="high" className="aspect-video w-full object-cover" />
            </figure>
          )}

          <div className="max-w-3xl">
            <TableOfContents headings={headings} />

            {/* ADSENSE: top-of-article unit */}
            <AdSlot slot="article-top" />

            <div id="article-body" className="article prose">
              <MarkdownView ads>{post.content}</MarkdownView>
            </div>

            {/* Tags */}
            {post.keywords.length > 0 && (
              <nav aria-label="Tags" className="mt-10 flex flex-wrap gap-2">
                {post.keywords.map((k) => (
                  <Link
                    key={k}
                    href={`/tag/${encodeURIComponent(k)}`}
                    className="border border-line bg-surface px-3 py-1 text-sm font-medium hover:border-ink hover:bg-taxi hover:text-ink"
                  >
                    #{k}
                  </Link>
                ))}
              </nav>
            )}

            {/* Closing engagement bar */}
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 bg-ink p-5 text-white">
              <p className="display text-xl">Enjoyed this story?</p>
              <LikeButton slug={post.slug} initialLikes={post.likes} initiallyLiked={liked} />
              <div className="text-white [&_*]:text-inherit">
                <ShareBar url={url} title={post.title} />
              </div>
            </div>

            {/* ADSENSE: end-of-article unit */}
            <AdSlot slot="article-bottom" />

            {/* Author box */}
            <section aria-label="About the author" className="flex gap-4 border-t-4 border-text pt-5">
              <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center bg-ink text-xl font-extrabold text-taxi">
                {initials}
              </span>
              <div>
                <p className="text-sm text-muted">Written by</p>
                <p className="display text-2xl">{AUTHOR_NAME}</p>
                <p className="mt-1 font-[family-name:var(--font-body)] text-base text-muted">{AUTHOR_BIO}</p>
              </div>
            </section>

            {/* Newsletter */}
            {live && (
              <section aria-label="Newsletter" className="mt-10 border-2 border-text p-6">
                <h2 className="display text-2xl sm:text-3xl">Get the next story in your inbox</h2>
                <p className="mb-4 mt-2 text-muted">New posts by email. No spam, and you can leave any time.</p>
                <SubscribeForm source="article" />
              </section>
            )}

            {live && <CommentSection slug={post.slug} comments={comments} />}
          </div>

          {/* Previous / next story */}
          {(newer || older) && (
            <nav aria-label="More stories" className="mt-12 grid gap-4 sm:grid-cols-2">
              {older ? (
                <Link href={`/blog/${older.slug}`} className="group border border-line bg-surface p-5 hover:border-ink">
                  <span className="text-sm text-muted">Previous story</span>
                  <span className="mt-1 line-clamp-2 block text-lg font-bold leading-snug"><span className="hl">{older.title}</span></span>
                </Link>
              ) : <span />}
              {newer ? (
                <Link href={`/blog/${newer.slug}`} className="group border border-line bg-surface p-5 text-right hover:border-ink">
                  <span className="text-sm text-muted">Next story</span>
                  <span className="mt-1 line-clamp-2 block text-lg font-bold leading-snug"><span className="hl">{newer.title}</span></span>
                </Link>
              ) : <span />}
            </nav>
          )}

          {/* Also read */}
          {related.length > 0 && (
            <section aria-labelledby="also-read" className="mt-14">
              <div className="mb-5 border-t-4 border-text pt-3">
                <h2 id="also-read" className="display text-3xl">Also read</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside aria-label="Sidebar" className="hidden lg:block">
          <div className="sticky top-20 space-y-8">
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

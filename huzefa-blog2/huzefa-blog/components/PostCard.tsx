import Link from "next/link";
import { categoryHref, formatCount, formatDate } from "@/lib/site";

export type CardPost = {
  slug: string;
  title: string;
  coverImage: string;
  category: string;
  seoDescription: string;
  publishedAt: Date;
  views: number;
  likes: number;
};

function Meta({ post }: { post: CardPost }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
      <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{formatCount(post.views)} views</span>
      {post.likes > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>{formatCount(post.likes)} likes</span>
        </>
      )}
    </p>
  );
}

function CategoryTag({ category }: { category: string }) {
  return (
    <Link href={categoryHref(category)} className="text-xs font-bold uppercase tracking-wide text-red-600 hover:underline">
      {category}
    </Link>
  );
}

/* eslint-disable @next/next/no-img-element -- cover URLs can come from any host */

export default function PostCard({
  post,
  variant = "default",
  priority = false,
}: {
  post: CardPost;
  variant?: "hero" | "default" | "compact";
  priority?: boolean;
}) {
  const href = `/blog/${post.slug}`;

  if (variant === "hero") {
    return (
      <article className="group relative overflow-hidden rounded-lg bg-zinc-900">
        <Link href={href} className="block">
          <img
            src={post.coverImage}
            alt={post.title}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="aspect-[16/10] w-full object-cover opacity-90 transition group-hover:scale-[1.02] group-hover:opacity-100 sm:aspect-[16/9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </Link>
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white sm:p-6">
          <span className="inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
            {post.category}
          </span>
          <h2 className="text-xl font-bold leading-tight sm:text-3xl">
            <Link href={href} className="hover:underline">{post.title}</Link>
          </h2>
          <p className="hidden max-w-2xl text-sm text-zinc-200 sm:block">{post.seoDescription}</p>
          <p className="text-xs text-zinc-300">
            {formatDate(post.publishedAt)} · {formatCount(post.views)} views
          </p>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="flex gap-3">
        <Link href={href} className="block h-16 w-24 shrink-0 overflow-hidden rounded bg-zinc-100">
          <img src={post.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
        </Link>
        <div className="min-w-0 space-y-1">
          <CategoryTag category={post.category} />
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            <Link href={href} className="hover:underline">{post.title}</Link>
          </h3>
          <Meta post={post} />
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col">
      <Link href={href} className="block aspect-video overflow-hidden rounded-lg bg-zinc-100">
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <CategoryTag category={post.category} />
        <h3 className="text-lg font-bold leading-snug">
          <Link href={href} className="hover:underline">{post.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm text-zinc-600">{post.seoDescription}</p>
        <div className="mt-auto pt-1">
          <Meta post={post} />
        </div>
      </div>
    </article>
  );
}

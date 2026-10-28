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

function Meta({ post, className = "" }: { post: CardPost; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 text-[0.8rem] text-muted ${className}`}>
      <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
      <span>{formatCount(post.views)} views</span>
    </p>
  );
}

/** Category name with a small yellow square — the square marks "section" across the whole site. */
function CategoryTag({ category, onDark = false }: { category: string; onDark?: boolean }) {
  return (
    <Link
      href={categoryHref(category)}
      className={`inline-flex items-center gap-2 text-sm font-bold ${onDark ? "text-white" : "text-text"} hover:underline decoration-taxi decoration-2 underline-offset-4`}
    >
      <span aria-hidden className="h-2.5 w-2.5 bg-taxi" />
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
  variant?: "hero" | "default" | "compact" | "wide" | "text";
  priority?: boolean;
}) {
  const href = `/blog/${post.slug}`;

  if (variant === "hero") {
    // Big picture, with a black block laid over its lower-left corner carrying the headline.
    return (
      <article className="group relative">
        <Link href={href} className="block overflow-hidden bg-soft" tabIndex={-1} aria-hidden>
          <img
            src={post.coverImage}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:aspect-[16/10]"
          />
        </Link>
        <div className="relative -mt-14 mr-0 bg-ink p-5 text-white sm:-mt-24 sm:mr-12 sm:p-7 lg:mr-20">
          <CategoryTag category={post.category} onDark />
          <h2 className="display mt-3 text-[1.7rem] sm:text-4xl lg:text-[2.7rem]">
            <Link href={href}>
              <span className="group-hover:text-taxi transition-colors">{post.title}</span>
            </Link>
          </h2>
          <p className="mt-3 hidden max-w-xl font-[family-name:var(--font-body)] text-base leading-relaxed text-white/75 sm:line-clamp-2 sm:block">
            {post.seoDescription}
          </p>
          <Meta post={post} className="mt-4 !text-white/60" />
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex gap-4">
        <Link href={href} className="block h-20 w-28 shrink-0 overflow-hidden bg-soft" tabIndex={-1} aria-hidden>
          <img src={post.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </Link>
        <div className="min-w-0 space-y-1">
          <CategoryTag category={post.category} />
          <h3 className="line-clamp-3 text-[1.02rem] font-bold leading-snug">
            <Link href={href}><span className="hl">{post.title}</span></Link>
          </h3>
          <Meta post={post} />
        </div>
      </article>
    );
  }

  if (variant === "text") {
    return (
      <article className="group border-t border-line py-4">
        <h3 className="text-lg font-bold leading-snug">
          <Link href={href}><span className="hl">{post.title}</span></Link>
        </h3>
        <Meta post={post} className="mt-1.5" />
      </article>
    );
  }

  if (variant === "wide") {
    return (
      <article className="group grid gap-5 sm:grid-cols-[1.15fr_1fr]">
        <Link href={href} className="block overflow-hidden bg-soft" tabIndex={-1} aria-hidden>
          <img src={post.coverImage} alt="" loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        </Link>
        <div className="flex flex-col justify-center gap-2.5">
          <CategoryTag category={post.category} />
          <h3 className="display text-2xl sm:text-[1.9rem]">
            <Link href={href}><span className="hl">{post.title}</span></Link>
          </h3>
          <p className="line-clamp-3 font-[family-name:var(--font-body)] text-base leading-relaxed text-muted">{post.seoDescription}</p>
          <Meta post={post} />
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col">
      <Link href={href} className="block aspect-[3/2] overflow-hidden bg-soft" tabIndex={-1} aria-hidden>
        <img
          src={post.coverImage}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="mt-3.5 flex flex-1 flex-col gap-2">
        <CategoryTag category={post.category} />
        <h3 className="text-[1.3rem] font-extrabold leading-[1.18] tracking-tight">
          <Link href={href}><span className="hl">{post.title}</span></Link>
        </h3>
        <p className="line-clamp-2 font-[family-name:var(--font-body)] text-[0.95rem] leading-relaxed text-muted">{post.seoDescription}</p>
        <div className="mt-auto pt-1">
          <Meta post={post} />
        </div>
      </div>
    </article>
  );
}

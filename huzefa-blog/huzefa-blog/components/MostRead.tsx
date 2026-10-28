import Link from "next/link";
import { formatCount } from "@/lib/site";
import type { CardPost } from "./PostCard";

/** Ranked list of the most-read stories (the numbers are a real ranking). */
export default function MostRead({ posts }: { posts: CardPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="most-read-heading" className="bg-ink p-5 text-white">
      <h2 id="most-read-heading" className="display text-2xl">
        Most read
      </h2>
      <ol className="mt-4 divide-y divide-white/15">
        {posts.map((p, i) => (
          <li key={p.slug} className="group flex gap-4 py-3.5">
            <span className="display w-7 shrink-0 text-3xl text-taxi" aria-hidden>{i + 1}</span>
            <div className="min-w-0">
              <Link href={`/blog/${p.slug}`} className="line-clamp-3 text-[0.95rem] font-semibold leading-snug">
                <span className="group-hover:text-taxi">{p.title}</span>
              </Link>
              <p className="mt-1 text-xs text-white/60">{formatCount(p.views)} views</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

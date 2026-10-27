import Link from "next/link";
import { formatCount } from "@/lib/site";
import type { CardPost } from "./PostCard";

/** Numbered "Most read" list, ranked by views. */
export default function MostRead({ posts }: { posts: CardPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="most-read-heading">
      <h2 id="most-read-heading" className="border-b-2 border-red-600 pb-2 text-lg font-bold">
        Most read
      </h2>
      <ol className="mt-3 divide-y divide-zinc-200">
        {posts.map((p, i) => (
          <li key={p.slug} className="flex gap-3 py-3">
            <span className="text-2xl font-black leading-none text-zinc-300">{i + 1}</span>
            <div className="min-w-0">
              <Link href={`/blog/${p.slug}`} className="line-clamp-3 text-sm font-semibold leading-snug hover:underline">
                {p.title}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">{formatCount(p.views)} views</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import MostRead from "@/components/MostRead";
import PostCard from "@/components/PostCard";
import { getCategories } from "@/lib/categories";
import { getFeatured, getLatest, getMostRead } from "@/lib/queries";
import { categoryHref } from "@/lib/site";

export const dynamic = "force-dynamic";

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between border-b-2 border-red-600 pb-2">
      <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
      {href && <Link href={href} className="text-sm font-semibold text-red-600 hover:underline">View all →</Link>}
    </div>
  );
}

export default async function HomePage() {
  const [categories, featured, mostRead] = await Promise.all([getCategories(), getFeatured(), getMostRead(5)]);

  const [latest, byCategory] = await Promise.all([
    getLatest({ take: 11, excludeSlugs: featured ? [featured.slug] : [] }),
    Promise.all(categories.map(async (c) => ({ category: c.name, posts: await getLatest({ take: 3, category: c.name }) }))),
  ]);

  // The lead story is the featured post if there is one, otherwise the newest post.
  const lead = featured ?? latest[0];
  const rest = featured ? latest : latest.slice(1);

  if (!lead) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-zinc-500">
        No stories yet. Publish your first one from <Link href="/admin" className="underline">/admin</Link>.
      </div>
    );
  }

  const topStories = rest.slice(0, 4);
  const latestGrid = rest.slice(4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="sr-only">Latest stories from Huzefa Dayatar</h1>

      {/* Lead story + top stories */}
      <section aria-label="Top stories" className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PostCard post={lead} variant="hero" priority />
        {topStories.length > 0 && (
          <div>
            <SectionHeading title="Top stories" />
            <div className="space-y-4">
              {topStories.map((p) => (
                <PostCard key={p.slug} post={p} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Latest + sidebar */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-12">
          {latestGrid.length > 0 && (
            <section aria-label="Latest stories">
              <SectionHeading title="Latest" />
              <div className="grid gap-6 sm:grid-cols-2">
                {latestGrid.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}

          {byCategory
            .filter((s) => s.posts.length > 0)
            .map((s) => (
              <section key={s.category} aria-label={s.category}>
                <SectionHeading title={s.category} href={categoryHref(s.category)} />
                <div className="grid gap-6 sm:grid-cols-3">
                  {s.posts.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              </section>
            ))}
        </div>

        <aside aria-label="Sidebar" className="space-y-8">
          <div className="sticky top-28 space-y-8">
            <MostRead posts={mostRead} />
            {/* ADSENSE: homepage sidebar unit (300x250 / 300x600) */}
            <AdSlot slot="home-sidebar" />
          </div>
        </aside>
      </div>
    </div>
  );
}

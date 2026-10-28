import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import MostRead from "@/components/MostRead";
import PostCard from "@/components/PostCard";
import SubscribeForm from "@/components/SubscribeForm";
import { getCategories } from "@/lib/categories";
import { getFeatured, getLatest, getMostRead } from "@/lib/queries";
import { categoryHref } from "@/lib/site";

export const dynamic = "force-dynamic";

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-t-4 border-text pt-3">
      <h2 className="display text-[1.7rem] sm:text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-bold hover:underline decoration-taxi decoration-[3px] underline-offset-4">
          All stories
        </Link>
      )}
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
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="display text-3xl">No stories yet</h1>
        <p className="mt-3 text-muted">
          Publish your first one from <Link href="/admin" className="font-semibold underline decoration-taxi decoration-[3px] underline-offset-4">the admin panel</Link>.
        </p>
      </div>
    );
  }

  const topStories = rest.slice(0, 4);
  const moreStories = rest.slice(4);
  const sections = byCategory.filter((s) => s.posts.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="sr-only">Latest stories from Huzefa Dayatar</h1>

      {/* Lead story + the next four */}
      <section aria-label="Top stories" className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <PostCard post={lead} variant="hero" priority />
        {topStories.length > 0 && (
          <div>
            <SectionHeading title="Also today" />
            <div className="space-y-5">
              {topStories.map((p) => (
                <PostCard key={p.slug} post={p} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-16">
          {moreStories.length > 0 && (
            <section aria-label="More stories">
              <SectionHeading title="More stories" />
              <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2">
                {moreStories.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}

          {sections.map((s, i) => {
            const [first, ...others] = s.posts;
            return (
              <section key={s.category} aria-label={s.category}>
                <SectionHeading title={s.category} href={categoryHref(s.category)} />
                {i % 2 === 0 ? (
                  <div className="space-y-8">
                    <PostCard post={first} variant="wide" />
                    {others.length > 0 && (
                      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
                        {others.map((p) => (
                          <PostCard key={p.slug} post={p} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-[1fr_1fr]">
                    <PostCard post={first} />
                    {others.length > 0 && (
                      <div className="space-y-5 sm:border-l sm:border-line sm:pl-8">
                        {others.map((p) => (
                          <PostCard key={p.slug} post={p} variant="compact" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <aside aria-label="Sidebar">
          <div className="sticky top-20 space-y-8">
            <MostRead posts={mostRead} />
            <div className="border-2 border-text p-5">
              <h2 className="display text-2xl">Never miss a story</h2>
              <p className="mb-4 mt-2 text-sm text-muted">New posts by email. Nothing else.</p>
              <SubscribeForm source="home-sidebar" />
            </div>
            {/* ADSENSE: homepage sidebar unit (300x250 / 300x600) */}
            <AdSlot slot="home-sidebar" />
          </div>
        </aside>
      </div>
    </div>
  );
}

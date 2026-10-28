import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCount, formatDate } from "@/lib/site";

export const dynamic = "force-dynamic";

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 text-sm">
          <span className="truncate" title={r.label}>{r.label}</span>
          <span className="h-4 bg-soft" aria-hidden>
            <span className="block h-full bg-ink" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold">{formatCount(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const now = new Date();
  const since = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

  let problem = "";
  let totals = { posts: 0, views: 0, likes: 0, comments: 0, subscribers: 0 };
  let top: { slug: string; title: string; views: number; likes: number; publishedAt: Date }[] = [];
  let byCategory: { label: string; value: number }[] = [];
  let signups: { label: string; value: number }[] = [];

  try {
    const live = { status: "published", publishedAt: { lte: now } };
    const [posts, sums, topPosts, cats, subs] = await Promise.all([
      prisma.post.count({ where: live }),
      prisma.post.aggregate({ where: live, _sum: { views: true, likes: true } }),
      prisma.post.findMany({ where: live, orderBy: { views: "desc" }, take: 10, select: { slug: true, title: true, views: true, likes: true, publishedAt: true } }),
      prisma.post.groupBy({ by: ["category"], where: live, _sum: { views: true }, orderBy: { _sum: { views: "desc" } } }),
      prisma.subscriber.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }).catch(() => []),
    ]);
    const [comments, subscribers] = await Promise.all([
      prisma.comment.count({ where: { status: "approved" } }).catch(() => 0),
      prisma.subscriber.count().catch(() => 0),
    ]);
    totals = { posts, views: sums._sum.views ?? 0, likes: sums._sum.likes ?? 0, comments, subscribers };
    top = topPosts;
    byCategory = cats.map((c) => ({ label: c.category, value: c._sum.views ?? 0 }));
    const perDay = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      perDay.set(d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }), 0);
    }
    for (const s of subs) {
      const k = s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
      if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    signups = [...perDay].map(([label, value]) => ({ label, value }));
  } catch (e) {
    console.error("Analytics failed:", e);
    problem = "Could not load the numbers. Run the upgrade SQL files in Neon's SQL Editor, then reload.";
  }

  const engagement = totals.views > 0 ? ((totals.likes / totals.views) * 100).toFixed(1) : "0";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="display text-3xl">Analytics</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Counts come from your own site. For visitors by country or device, add Google Analytics later.</p>
      {problem && <p className="mb-4 border-l-4 border-signal bg-surface p-3 text-sm text-signal" role="alert">{problem}</p>}

      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Live posts", formatCount(totals.posts)],
          ["Views", formatCount(totals.views)],
          ["Likes", formatCount(totals.likes)],
          ["Likes per 100 views", engagement],
          ["Comments", formatCount(totals.comments)],
          ["Subscribers", formatCount(totals.subscribers)],
        ].map(([k, v]) => (
          <div key={k} className="border border-line bg-surface p-4">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="display mt-1 text-3xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="a-cat" className="border border-line bg-surface p-5">
          <h2 id="a-cat" className="mb-4 text-lg font-extrabold">Views by category</h2>
          {byCategory.length ? <Bars rows={byCategory} /> : <p className="text-sm text-muted">No data yet.</p>}
        </section>
        <section aria-labelledby="a-sub" className="border border-line bg-surface p-5">
          <h2 id="a-sub" className="mb-4 text-lg font-extrabold">New subscribers, last 14 days</h2>
          {signups.some((s) => s.value > 0) ? <Bars rows={signups} /> : <p className="text-sm text-muted">No sign-ups in the last 14 days.</p>}
        </section>
      </div>

      <section aria-labelledby="a-top" className="mt-8 border border-line bg-surface p-5">
        <h2 id="a-top" className="mb-4 text-lg font-extrabold">Most-read posts</h2>
        {top.length === 0 ? (
          <p className="text-sm text-muted">No posts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr><th className="pb-2">Post</th><th className="pb-2 text-right">Views</th><th className="pb-2 text-right">Likes</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {top.map((p) => (
                <tr key={p.slug}>
                  <td className="py-2.5 pr-4">
                    <Link href={`/blog/${p.slug}`} className="font-semibold hover:underline decoration-taxi decoration-2 underline-offset-4">{p.title}</Link>
                    <p className="text-xs text-muted">{formatDate(p.publishedAt)}</p>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{formatCount(p.views)}</td>
                  <td className="py-2.5 text-right">{formatCount(p.likes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

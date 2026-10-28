import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { unpublishPost } from "@/app/actions/posts";
import BulkBar from "@/components/admin/BulkBar";
import DeleteButton from "@/components/admin/DeleteButton";
import { getCategories } from "@/lib/categories";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCount, formatDateTime } from "@/lib/site";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  published: "Post published.",
  updated: "Post updated.",
  scheduled: "Post scheduled — it will go live at the chosen time.",
  draft: "Saved as a draft (not visible to the public).",
  unpublished: "Post taken offline and saved as a draft.",
  deleted: "Post deleted.",
  nothing: "Nothing changed. Tick some posts and choose an action.",
  failed: "That did not work. Please try again.",
  "bulk-deleted": "The ticked posts were deleted.",
  "bulk-draft": "The ticked posts were moved to drafts.",
  "bulk-moved": "The ticked posts were moved to the new category.",
};

const TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const SEO_LABEL: Record<string, string> = { ai: "AI", manual: "Manual", auto: "—" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; notice?: string }>;
}) {
  if (!(await isAdmin())) {
    return (
      <div className="px-4">
        <LoginForm />
      </div>
    );
  }

  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.status) ? (sp.status as Tab) : "all";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const notice = sp.notice ? NOTICES[sp.notice] : undefined;
  const now = new Date();

  const byTab: Record<Tab, Prisma.PostWhereInput> = {
    all: {},
    published: { status: "published", publishedAt: { lte: now } },
    scheduled: { status: "published", publishedAt: { gt: now } },
    draft: { status: "draft" },
  };

  let loadError = "";
  let posts: {
    id: string; slug: string; title: string; category: string; status: string; featured: boolean;
    seoSource: string; publishedAt: Date; updatedAt: Date; views: number; likes: number;
  }[] = [];
  let counts: Record<Tab, number> = { all: 0, published: 0, scheduled: 0, draft: 0 };
  let totals = { views: 0, likes: 0 };
  const categoryNames = (await getCategories()).map((c) => c.name);

  try {
    const [list, all, pub, sched, draft, sums] = await Promise.all([
      prisma.post.findMany({
        where: { ...byTab[tab], ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true, slug: true, title: true, category: true, status: true, featured: true,
          seoSource: true, publishedAt: true, updatedAt: true, views: true, likes: true,
        },
      }),
      prisma.post.count(),
      prisma.post.count({ where: byTab.published }),
      prisma.post.count({ where: byTab.scheduled }),
      prisma.post.count({ where: byTab.draft }),
      prisma.post.aggregate({ _sum: { views: true, likes: true } }),
    ]);
    posts = list;
    counts = { all, published: pub, scheduled: sched, draft };
    totals = { views: sums._sum.views ?? 0, likes: sums._sum.likes ?? 0 };
  } catch (e) {
    console.error("Admin list failed:", e);
    loadError =
      "Could not load posts. If you just updated the site, run the upgrade SQL (prisma/upgrade-admin-panel.sql) in Neon's SQL Editor.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-3xl">Posts</h1>
        <Link href="/admin/new" className="bg-taxi px-4 py-2 text-sm font-bold text-ink hover:brightness-95 border-2 border-ink">
          + New post
        </Link>
      </div>

      {notice && <p className="mb-4 border-l-4 border-taxi bg-surface p-3 text-sm font-semibold" role="status">{notice}</p>}
      {loadError && <p className="mb-4 border-l-4 border-signal bg-surface p-3 text-sm text-signal" role="alert">{loadError}</p>}

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Posts", counts.all],
          ["Total views", formatCount(totals.views)],
          ["Total likes", formatCount(totals.likes)],
          ["Drafts", counts.draft],
        ].map(([k, v]) => (
          <div key={k as string} className="border border-line bg-surface p-4">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="mt-1 display text-3xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter posts" className="flex flex-wrap gap-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1.5 font-semibold ${tab === t.key ? "bg-ink text-taxi" : "bg-surface hover:bg-soft"}`}
            >
              {t.label} ({counts[t.key]})
            </Link>
          ))}
        </nav>
        <form action="/admin" role="search" className="flex">
          <input type="hidden" name="status" value={tab} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            aria-label="Search posts by title"
            className="border border-r-0 border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-ink"
          />
          <button type="submit" className="bg-ink px-3 py-1.5 text-sm font-semibold text-white">Search</button>
        </form>
      </div>

      {posts.length > 0 && <BulkBar categories={categoryNames} />}

      {posts.length === 0 && !loadError ? (
        <p className="border border-line bg-surface p-8 text-center text-muted">
          {q || tab !== "all" ? "No posts match this filter." : "No posts yet. Write your first one!"}
        </p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-soft text-xs text-muted">
              <tr>
                <th className="w-8 px-4 py-3"><span className="sr-only">Select</span></th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SEO</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Likes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => {
                const scheduled = p.status === "published" && p.publishedAt > now;
                const label = p.status === "draft" ? "Draft" : scheduled ? "Scheduled" : "Published";
                const color =
                  p.status === "draft" ? "bg-zinc-100 text-zinc-700" : scheduled ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
                return (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <input type="checkbox" name="ids" value={p.id} form="bulk-form" aria-label={`Select ${p.title}`} className="h-4 w-4" />
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <Link href={`/admin/edit/${p.id}`} className="font-semibold hover:underline decoration-taxi decoration-2 underline-offset-4">
                        {p.featured && <span title="Featured" className="mr-1 text-amber-500">★</span>}
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted">{p.category}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span></td>
                    <td className="px-4 py-3 text-muted">{SEO_LABEL[p.seoSource] ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(p.status === "draft" ? p.updatedAt : p.publishedAt)}</td>
                    <td className="px-4 py-3 text-right">{formatCount(p.views)}</td>
                    <td className="px-4 py-3 text-right">{formatCount(p.likes)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Link href={`/admin/edit/${p.id}`} className="text-sm font-medium text-blue-700 hover:underline">Edit</Link>
                        <Link href={`/blog/${p.slug}`} className="text-sm font-medium hover:underline">{p.status === "draft" ? "Preview" : "View"}</Link>
                        {p.status === "published" && (
                          <form action={unpublishPost}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="text-sm font-medium text-amber-700 hover:underline">Unpublish</button>
                          </form>
                        )}
                        <DeleteButton id={p.id} title={p.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {posts.length === 100 && <p className="mt-3 text-xs text-zinc-500">Showing the 100 most recently changed posts. Use search to find older ones.</p>}
    </div>
  );
}

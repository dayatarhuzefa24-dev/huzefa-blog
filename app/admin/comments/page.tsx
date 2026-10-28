import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteComment, setCommentStatus } from "@/app/actions/comments";
import DeleteComment from "@/components/admin/ConfirmButton";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/site";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Waiting for approval" },
  { key: "approved", label: "Approved" },
  { key: "spam", label: "Spam" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const btn = "text-sm font-semibold hover:underline";

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.status) ? (sp.status as Tab) : "pending";

  let problem = "";
  let counts: Record<Tab, number> = { pending: 0, approved: 0, spam: 0 };
  let rows: {
    id: string; name: string; email: string; body: string; status: string; createdAt: Date;
    post: { slug: string; title: string };
  }[] = [];

  try {
    const [pending, approved, spam, list] = await Promise.all([
      prisma.comment.count({ where: { status: "pending" } }),
      prisma.comment.count({ where: { status: "approved" } }),
      prisma.comment.count({ where: { status: "spam" } }),
      prisma.comment.findMany({
        where: { status: tab },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, name: true, email: true, body: true, status: true, createdAt: true,
          post: { select: { slug: true, title: true } },
        },
      }),
    ]);
    counts = { pending, approved, spam };
    rows = list;
  } catch (e) {
    console.error("Comments page failed:", e);
    problem = "The comments table is missing. Run prisma/upgrade-v3.sql in Neon's SQL Editor, then reload this page.";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-3xl">Comments</h1>
      <p className="mb-5 mt-1 text-sm text-muted">New comments stay hidden until you approve them.</p>

      {problem && <p className="mb-4 border-l-4 border-signal bg-surface p-3 text-sm text-signal" role="alert">{problem}</p>}

      <nav aria-label="Filter comments" className="mb-4 flex flex-wrap gap-1 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/comments?status=${t.key}`}
            className={`px-3 py-1.5 font-semibold ${tab === t.key ? "bg-ink text-taxi" : "bg-surface hover:bg-soft"}`}
          >
            {t.label} ({counts[t.key]})
          </Link>
        ))}
      </nav>

      {rows.length === 0 && !problem ? (
        <p className="border border-line bg-surface p-8 text-center text-muted">
          {tab === "pending" ? "Nothing is waiting for approval." : "No comments here."}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="border border-line bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <span className="font-bold">{c.name}</span>
                  {c.email && <span className="text-muted"> ({c.email})</span>}
                </p>
                <p className="text-xs text-muted">{formatDateTime(c.createdAt)}</p>
              </div>
              <p className="mt-1 text-xs text-muted">
                On <Link href={`/blog/${c.post.slug}`} className="font-semibold text-text underline decoration-taxi decoration-2 underline-offset-2">{c.post.title}</Link>
              </p>
              <p className="mt-3 whitespace-pre-line break-words text-[0.95rem]">{c.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                {c.status !== "approved" && (
                  <form action={setCommentStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className={`${btn} text-green-700`}>Approve</button>
                  </form>
                )}
                {c.status === "approved" && (
                  <form action={setCommentStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="pending" />
                    <button type="submit" className={`${btn} text-amber-700`}>Hide (back to waiting)</button>
                  </form>
                )}
                {c.status !== "spam" && (
                  <form action={setCommentStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="spam" />
                    <button type="submit" className={`${btn} text-amber-700`}>Mark as spam</button>
                  </form>
                )}
                <DeleteComment
                  action={deleteComment}
                  id={c.id}
                  label="Delete"
                  message="Delete this comment for good?"
                  className={`${btn} text-signal`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

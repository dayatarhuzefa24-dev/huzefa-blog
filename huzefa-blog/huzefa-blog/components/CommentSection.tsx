import CommentForm from "@/components/comments/CommentForm";

export type PublicComment = { id: string; name: string; body: string; createdAt: Date };

const when = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default function CommentSection({ slug, comments }: { slug: string; comments: PublicComment[] }) {
  return (
    <section aria-labelledby="comments-heading" className="mt-14 border-t-4 border-text pt-5">
      <h2 id="comments-heading" className="display text-3xl">
        {comments.length === 0 ? "Comments" : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
      </h2>

      {comments.length > 0 ? (
        <ul className="mt-6 divide-y divide-line">
          {comments.map((c) => (
            <li key={c.id} className="py-5">
              <div className="flex items-center gap-3">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center bg-ink text-sm font-extrabold text-taxi">
                  {c.name.trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-muted">{when(c.createdAt)}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line break-words font-[family-name:var(--font-body)] text-[1.05rem] leading-relaxed">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-muted">No comments yet. Start the conversation.</p>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-xl font-extrabold">Leave a comment</h3>
        <CommentForm slug={slug} />
      </div>
    </section>
  );
}

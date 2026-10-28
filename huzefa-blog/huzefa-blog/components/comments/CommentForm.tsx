"use client";

import { useActionState } from "react";
import { submitComment, type CommentState } from "@/app/actions/comments";

const field = "w-full border-2 border-line bg-surface px-3 py-2.5 text-base text-text outline-none focus:border-ink";

export default function CommentForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(submitComment, {});

  if (state.ok) {
    return (
      <p role="status" className="border-l-4 border-taxi bg-surface p-4 text-base font-semibold">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      {/* Bots fill this hidden box; people never see it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1 block text-sm font-semibold">Name</label>
          <input id="c-name" name="name" required maxLength={60} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block text-sm font-semibold">
            Email <span className="font-normal text-muted">(optional, never shown)</span>
          </label>
          <input id="c-email" name="email" type="email" maxLength={120} autoComplete="email" className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="c-body" className="mb-1 block text-sm font-semibold">Your comment</label>
        <textarea id="c-body" name="body" required rows={5} maxLength={2000} className={`${field} font-[family-name:var(--font-body)]`} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="border-2 border-ink bg-taxi px-6 py-2.5 text-base font-bold text-ink hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post comment"}
        </button>
        <p className="text-sm text-muted">Comments are checked before they appear.</p>
      </div>
      {state.error && <p role="alert" className="text-sm font-semibold text-signal">{state.error}</p>}
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createPost, type PostFormState } from "@/app/actions/posts";
import { CATEGORIES } from "@/lib/site";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900";

export default function PostForm() {
  const [state, action, pending] = useActionState<PostFormState, FormData>(createPost, {});
  // Controlled fields so nothing is lost if the AI/DB step returns an error.
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">Blog title</label>
        <input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="coverImage" className="mb-1 block text-sm font-medium">Cover image URL</label>
          <input
            id="coverImage"
            name="coverImage"
            type="url"
            required
            placeholder="https://…"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
          <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="content" className="text-sm font-medium">Content (Markdown)</label>
          <div className="flex gap-1 text-sm">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 capitalize ${tab === t ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {/* Keep the textarea mounted (just hidden) so its value is always submitted. */}
        <textarea
          id="content"
          name="content"
          required
          rows={18}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"## Heading\n\nWrite your post in Markdown…"}
          className={`${inputClass} font-mono text-sm ${tab === "write" ? "" : "hidden"}`}
        />
        {tab === "preview" && (
          <div className="prose prose-zinc min-h-[24rem] max-w-none rounded-lg border border-zinc-300 p-4">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-zinc-400">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Generating SEO data & publishing…" : "Publish post"}
      </button>
    </form>
  );
}

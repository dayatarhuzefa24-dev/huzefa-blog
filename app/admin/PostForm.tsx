"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { savePost, type PostFormState } from "@/app/actions/posts";
import CoverImageField from "@/components/admin/CoverImageField";
import ImageInsertModal from "@/components/admin/ImageInsertModal";
import MarkdownView from "@/components/MarkdownView";
import { fromIstInput, toIstInput } from "@/lib/ist";
import { slugify } from "@/lib/slug";

export type EditorPost = {
  id?: string;
  title: string;
  slug: string;
  coverImage: string;
  category: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  /** comma separated */
  tags: string;
  seoSource: "ai" | "manual" | "auto";
  status: "draft" | "published";
  featured: boolean;
  /** ISO string of the publish date, or "" */
  publishedAtIso: string;
};

const field = "w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900";
const card = "rounded-xl border border-zinc-200 bg-white p-4";
const label = "mb-1 block text-sm font-medium";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={`text-xs ${value.length > max ? "text-red-600" : "text-zinc-500"}`}>
      {value.length}/{max}
    </span>
  );
}

const SEO_BADGE: Record<EditorPost["seoSource"], string> = {
  ai: "SEO written by AI",
  manual: "SEO written by you",
  auto: "SEO not generated yet",
};

export default function PostForm({ categories, post }: { categories: string[]; post?: EditorPost }) {
  const isEdit = Boolean(post?.id);
  const wasPublished = post?.status === "published";

  const [state, action, pending] = useActionState<PostFormState, FormData>(savePost, {});

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [category, setCategory] = useState(post?.category ?? categories[0] ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [imageModal, setImageModal] = useState(false);

  // SEO — these three fields are always available, in both modes.
  const [seoMode, setSeoMode] = useState<"ai" | "manual">(post?.seoSource === "manual" ? "manual" : "ai");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [tags, setTags] = useState(post?.tags ?? "");
  const [regenerate, setRegenerate] = useState(false);

  // Publishing
  const [publishedLocal, setPublishedLocal] = useState(toIstInput(post?.publishedAtIso));
  const [featured, setFeatured] = useState(post?.featured ?? false);

  // Warn before leaving with unsaved changes.
  const snapshot = JSON.stringify([title, slug, coverImage, category, content, seoTitle, seoDescription, tags, publishedLocal, featured]);
  const [initialSnapshot] = useState(snapshot);
  const dirty = snapshot !== initialSnapshot;
  useEffect(() => {
    if (!dirty || pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  /** Replace the current selection in the editor (and keep the cursor sensible). */
  function apply(make: (selected: string) => { text: string; select?: [number, number] }) {
    const ta = document.getElementById("content") as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const { text, select } = make(content.slice(start, end));
    setContent(content.slice(0, start) + text + content.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const [a, b] = select ?? [text.length, text.length];
      ta.setSelectionRange(start + a, start + b);
    });
  }

  const wrap = (mark: string, placeholder: string) => () =>
    apply((sel) => {
      const inner = sel || placeholder;
      return { text: `${mark}${inner}${mark}`, select: [mark.length, mark.length + inner.length] };
    });
  const block = (prefix: string, placeholder: string) => () =>
    apply((sel) => {
      const inner = sel || placeholder;
      const lead = `\n\n${prefix}`;
      return { text: `${lead}${inner}\n\n`, select: [lead.length, lead.length + inner.length] };
    });
  const addLink = () =>
    apply((sel) => {
      const label = sel || "link text";
      const url = "https://";
      return { text: `[${label}](${url})`, select: [label.length + 3, label.length + 3 + url.length] };
    });

  const tools: { label: string; title: string; run: () => void; className?: string }[] = [
    { label: "B", title: "Bold", run: wrap("**", "bold text"), className: "font-bold" },
    { label: "I", title: "Italic", run: wrap("*", "italic text"), className: "italic" },
    { label: "H2", title: "Heading", run: block("## ", "Heading") },
    { label: "H3", title: "Sub-heading", run: block("### ", "Sub-heading") },
    { label: "❝", title: "Quote", run: block("> ", "Quote") },
    { label: "• List", title: "Bulleted list", run: block("- ", "List item") },
    { label: "Link", title: "Add a link", run: addLink },
  ];

  const publishedIso = fromIstInput(publishedLocal);
  const autoSlug = slugify(title);
  const categoryOptions = category && !categories.includes(category) ? [category, ...categories] : categories;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="publishedAt" value={publishedIso} />

      {/* ───────── Main column ───────── */}
      <div className="space-y-5">
        <div>
          <label htmlFor="title" className={label}>Title</label>
          <input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} text-lg font-semibold`} />
        </div>

        <div>
          <label htmlFor="slug" className={label}>Web address (optional)</label>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>/blog/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug || "made-from-the-title"}
              className={`${field} text-sm`}
            />
          </div>
          {isEdit && wasPublished && (
            <p className="mt-1 text-xs text-amber-700">Changing the address of a live post breaks links that were already shared.</p>
          )}
        </div>

        <div>
          <span className={label}>Cover image</span>
          <CoverImageField value={coverImage} onChange={setCoverImage} />
        </div>

        <div>
          <label htmlFor="category" className={label}>
            Category{" "}
            <Link href="/admin/categories" className="ml-2 text-xs font-normal text-red-700 underline">
              add or edit categories
            </Link>
          </label>
          <select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="content" className="text-sm font-medium">Content</label>
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

          {tab === "write" && (
            <div className="mb-2 flex flex-wrap gap-1" role="toolbar" aria-label="Formatting">
              {tools.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  title={t.title}
                  onClick={t.run}
                  className={`rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-sm hover:border-zinc-900 ${t.className ?? ""}`}
                >
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setImageModal(true)}
                className="rounded-md border border-red-600 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                🖼 Insert image
              </button>
            </div>
          )}

          {/* Always mounted (just hidden) so its text is submitted even from the Preview tab. */}
          <textarea
            id="content"
            name="content"
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Write your post…\n\nUse “Insert image” to add pictures anywhere, with an optional caption."}
            className={`${field} font-mono text-sm ${tab === "write" ? "" : "hidden"}`}
          />
          {tab === "preview" && (
            <div className="prose prose-zinc min-h-[24rem] max-w-none rounded-lg border border-zinc-300 p-4">
              {content.trim() ? <MarkdownView>{content}</MarkdownView> : <p className="text-zinc-400">Nothing to preview yet.</p>}
            </div>
          )}
        </div>
      </div>

      {/* ───────── Side column ───────── */}
      <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
        {/* Publish */}
        <section className={card} aria-label="Publish">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-700">Publish</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Status:{" "}
            <strong>{!isEdit ? "New post" : wasPublished ? "Published" : "Draft"}</strong>
          </p>

          <label htmlFor="publishedLocal" className={`${label} mt-3`}>Publish date &amp; time (India time)</label>
          <input
            id="publishedLocal"
            type="datetime-local"
            value={publishedLocal}
            onChange={(e) => setPublishedLocal(e.target.value)}
            className={field}
          />
          <p className="mt-1 text-xs text-zinc-500">Leave empty to publish now. A future time schedules the post — it goes live by itself.</p>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Feature on the homepage (lead story)
          </label>

          {state.error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={pending}
              className="border-2 border-ink bg-taxi px-4 py-2 text-sm font-bold text-ink hover:brightness-95 disabled:opacity-60"
            >
              {pending ? "Working…" : wasPublished ? "Update post" : "Publish"}
            </button>
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={pending}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:border-zinc-900 disabled:opacity-60"
            >
              {wasPublished ? "Unpublish (save as draft)" : "Save draft"}
            </button>
          </div>
          {pending && seoMode === "ai" && (
            <p className="mt-2 text-xs text-zinc-500">If AI is writing the SEO this can take up to 15 seconds…</p>
          )}
        </section>

        {/* SEO — always visible */}
        <section className={card} aria-label="SEO and tags">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-700">SEO &amp; tags</h2>
          {post && <p className="mt-1 text-xs text-zinc-500">{SEO_BADGE[post.seoSource]}</p>}

          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-start gap-2">
              <input type="radio" name="seoMode" value="ai" checked={seoMode === "ai"} onChange={() => setSeoMode("ai")} className="mt-1" />
              <span><strong>AI</strong> — fills in whatever you leave blank</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="seoMode" value="manual" checked={seoMode === "manual"} onChange={() => setSeoMode("manual")} className="mt-1" />
              <span><strong>Manual</strong> — no AI, your fields only</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {seoMode === "ai"
              ? "A meta title or description you type is used as-is. Your tags are always kept and the AI adds more."
              : "Your fields are used exactly as typed. Anything blank gets a safe automatic value."}
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="seoTitle" className={label}>Meta title</label>
              <Counter value={seoTitle} max={60} />
            </div>
            <input id="seoTitle" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Shown in Google results (max 60)" className={field} />
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <label htmlFor="seoDescription" className={label}>Meta description</label>
              <Counter value={seoDescription} max={160} />
            </div>
            <textarea
              id="seoDescription"
              name="seoDescription"
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Shown under the title in Google (max 160)"
              className={field}
            />
          </div>

          <div className="mt-3">
            <label htmlFor="tags" className={label}>Tags</label>
            <input id="tags" name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="mumbai, sensex, budget 2026" className={field} />
            <p className="mt-1 text-xs text-zinc-500">Separate with commas. Your tags are saved on the post, added to the SEO data, and shown under the article.</p>
          </div>

          {seoMode === "ai" && isEdit && post?.seoSource === "ai" && (
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input type="checkbox" name="regenerate" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} className="mt-1" />
              <span>Regenerate SEO with AI <span className="text-zinc-500">(replaces the meta title and description; your tags stay)</span></span>
            </label>
          )}
        </section>
      </aside>

      <ImageInsertModal
        open={imageModal}
        onClose={() => setImageModal(false)}
        onInsert={(md) => {
          setImageModal(false);
          setTab("write");
          apply(() => ({ text: `\n\n${md}\n\n` }));
        }}
      />
    </form>
  );
}

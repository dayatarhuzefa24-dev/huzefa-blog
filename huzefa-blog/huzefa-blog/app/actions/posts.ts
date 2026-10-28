"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSeoMeta } from "@/lib/ai";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { autoDescription, clamp, extractImages, finalizeJsonLd, parseTags } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/slug";

export type PostFormState = { error?: string };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function isValidCover(value: string): boolean {
  if (value.startsWith("/api/img/")) return true; // uploaded from the admin panel
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function freeSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const hit = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!hit) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Create or update a post.
 *
 * intent = "draft"    -> saved privately, no AI call, no cover/length rules.
 * intent = "publish"  -> validated, SEO metadata completed, then live (or scheduled
 *                        if the publish date is in the future).
 *
 * SEO rules (the Meta title / Meta description / Tags fields are ALWAYS available):
 *   - Manual mode: your fields are used as typed; anything left blank gets a safe automatic value.
 *   - AI mode:     the AI fills what you left blank; a Meta title/description you typed is kept;
 *                  your tags are ALWAYS kept, passed to the AI, and the AI's extra tags are added.
 *   - Editing an AI post keeps its SEO as-is unless you tick "Regenerate SEO with AI".
 * If the AI fails, nothing is saved, so the post is never half-finished.
 */
export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  if (!(await isAdmin())) return { error: "Not authorised. Please log in again." };

  const id = text(formData, "id");
  const publishing = text(formData, "intent") === "publish";
  const title = text(formData, "title");
  const slugInput = text(formData, "slug");
  const coverImage = text(formData, "coverImage");
  const category = text(formData, "category");
  const content = String(formData.get("content") ?? "").trim();
  const seoMode = text(formData, "seoMode") === "manual" ? "manual" : "ai";
  const regenerate = formData.get("regenerate") === "on";
  const featured = formData.get("featured") === "on";
  const typedTitle = clamp(text(formData, "seoTitle"), 60);
  const typedDescription = clamp(text(formData, "seoDescription"), 160);
  const tags = parseTags(String(formData.get("tags") ?? ""));

  // ── Validation ────────────────────────────────────────────────
  if (title.length < 3 || title.length > 200) return { error: "Title must be 3–200 characters." };
  const categories = await getCategories();
  if (categories.length === 0) return { error: "Add a category first (Admin → Categories)." };
  if (!categories.some((c) => c.name === category)) return { error: "Pick a valid category." };
  if (coverImage && !isValidCover(coverImage)) return { error: "Cover image must be an uploaded image or a valid http(s) link." };
  if (publishing) {
    if (!coverImage) return { error: "Add a cover image before publishing (Google Discover needs one)." };
    if (content.length < 100) return { error: "Content looks too short to publish (min 100 characters)." };
  }

  const existing = id ? await prisma.post.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "That post no longer exists." };

  // ── Slug (web address) ────────────────────────────────────────
  const typedSlug = slugInput ? slugify(slugInput) : "";
  let slug: string;
  if (existing) {
    slug = typedSlug || existing.slug;
    if (slug !== existing.slug) {
      const clash = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
      if (clash) return { error: `The web address “${slug}” is already used by another post.` };
    }
  } else if (typedSlug) {
    const clash = await prisma.post.findUnique({ where: { slug: typedSlug }, select: { id: true } });
    if (clash) return { error: `The web address “${typedSlug}” is already used by another post.` };
    slug = typedSlug;
  } else {
    slug = await freeSlug(slugify(title));
  }

  // ── Publish date ──────────────────────────────────────────────
  const dateRaw = text(formData, "publishedAt");
  const parsedDate = dateRaw ? new Date(dateRaw) : null;
  if (parsedDate && Number.isNaN(parsedDate.getTime())) return { error: "The publish date is not valid." };
  const now = new Date();
  const publishedAt =
    parsedDate ?? (existing && existing.status === "published" ? existing.publishedAt : now);

  // ── SEO package ───────────────────────────────────────────────
  const images = extractImages(content);
  const ctx = {
    title,
    category,
    coverImage,
    images,
    url: `${SITE_URL}/blog/${slug}`,
    publishedAt,
    modifiedAt: now,
  };

  let seoTitle: string;
  let seoDescription: string;
  let keywords: string[];
  let jsonLd: Record<string, unknown>;
  let seoSource: "ai" | "manual" | "auto";

  if (!publishing) {
    // Draft: keep whatever was typed; real SEO is completed when it is published.
    seoSource = seoMode === "manual" ? "manual" : existing?.seoSource === "ai" ? "ai" : "auto";
    seoTitle = typedTitle;
    seoDescription = typedDescription;
    keywords = tags;
    jsonLd = (existing?.jsonLd as Record<string, unknown> | undefined) ?? {};
  } else if (seoMode === "manual") {
    seoSource = "manual";
    seoTitle = typedTitle || clamp(title, 60);
    seoDescription = typedDescription || autoDescription(content);
    keywords = tags;
    jsonLd = finalizeJsonLd(existing?.jsonLd, { ...ctx, seoDescription, keywords });
  } else {
    const needAi = regenerate || !existing || existing.seoSource !== "ai";
    if (needAi) {
      try {
        const meta = await generateSeoMeta({
          ...ctx,
          content,
          requiredTags: tags,
          fixedSeoTitle: regenerate ? undefined : typedTitle || undefined,
          fixedSeoDescription: regenerate ? undefined : typedDescription || undefined,
        });
        ({ seoTitle, seoDescription, keywords, jsonLd } = meta);
        seoSource = "ai";
      } catch (e) {
        console.error("AI metadata generation failed:", e);
        const reason = e instanceof Error ? e.message : "unknown error";
        return {
          error: `AI metadata generation failed, so nothing was saved. You can switch SEO to “Manual” and publish anyway. (${reason})`,
        };
      }
    } else {
      // Editing an AI post without regenerating: keep its SEO, just apply what's in the fields.
      seoSource = "ai";
      seoTitle = typedTitle || existing.seoTitle || clamp(title, 60);
      seoDescription = typedDescription || existing.seoDescription || autoDescription(content);
      keywords = tags;
      jsonLd = finalizeJsonLd(existing.jsonLd, { ...ctx, seoDescription, keywords });
    }
  }

  // ── Save ──────────────────────────────────────────────────────
  const data = {
    slug,
    title,
    coverImage,
    category,
    content,
    seoTitle,
    seoDescription,
    keywords,
    jsonLd: jsonLd as unknown as Prisma.InputJsonValue,
    seoSource,
    status: publishing ? "published" : "draft",
    featured,
    publishedAt,
  };

  try {
    if (existing) await prisma.post.update({ where: { id: existing.id }, data });
    else await prisma.post.create({ data });
  } catch (e) {
    console.error("Saving post failed:", e);
    return { error: "Database error while saving. Did you run the upgrade SQL in Neon?" };
  }

  revalidatePath("/", "layout");
  const notice = !publishing ? "draft" : publishedAt.getTime() > Date.now() ? "scheduled" : existing ? "updated" : "published";
  redirect(`/admin?notice=${notice}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(formData, "id");
  if (id) {
    try {
      await prisma.post.delete({ where: { id } });
    } catch {
      // already deleted — nothing to do
    }
  }
  revalidatePath("/", "layout");
  redirect("/admin?notice=deleted");
}

/** Take a live or scheduled post offline (it becomes a draft). Publishing goes through the editor. */
export async function unpublishPost(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const id = text(formData, "id");
  if (id) {
    try {
      await prisma.post.update({ where: { id }, data: { status: "draft" } });
    } catch {
      // ignore: post may be gone
    }
  }
  revalidatePath("/", "layout");
  redirect("/admin?notice=unpublished");
}

/** Bulk actions from the posts table: move to drafts, change category, or delete the ticked posts. */
export async function bulkPosts(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const ids = formData.getAll("ids").map(String).filter(Boolean).slice(0, 200);
  const action = text(formData, "bulk");
  if (ids.length === 0) redirect("/admin?notice=nothing");

  try {
    if (action === "draft") {
      await prisma.post.updateMany({ where: { id: { in: ids } }, data: { status: "draft" } });
    } else if (action === "delete") {
      await prisma.post.deleteMany({ where: { id: { in: ids } } });
    } else if (action.startsWith("cat:")) {
      const name = action.slice(4);
      const exists = await prisma.category.findUnique({ where: { name }, select: { id: true } });
      if (!exists) redirect("/admin?notice=nothing");
      await prisma.post.updateMany({ where: { id: { in: ids } }, data: { category: name } });
    } else {
      redirect("/admin?notice=nothing");
    }
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // Next.js redirect
    console.error("Bulk action failed:", e);
    redirect("/admin?notice=failed");
  }
  revalidatePath("/", "layout");
  redirect(`/admin?notice=bulk-${action === "delete" ? "deleted" : action === "draft" ? "draft" : "moved"}`);
}

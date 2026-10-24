"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSeoMeta } from "@/lib/ai";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, SITE_URL } from "@/lib/site";
import { slugify } from "@/lib/slug";

export type PostFormState = { error?: string };

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * 1. verify admin  2. validate  3. ask Gemini for SEO metadata
 * 4. save content + metadata to Postgres  5. redirect to the new post.
 * Nothing is saved if the AI step fails, so every post has complete metadata.
 */
export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  if (!(await isAdmin())) return { error: "Not authorised. Please log in again." };

  const title = String(formData.get("title") ?? "").trim();
  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (title.length < 5 || title.length > 200) return { error: "Title must be 5–200 characters." };
  if (!isHttpUrl(coverImage)) return { error: "Cover image must be a valid http(s) URL." };
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Pick a valid category." };
  if (content.length < 100) return { error: "Content looks too short (min 100 characters)." };

  const slug = await uniqueSlug(title);
  const publishedAt = new Date();

  let meta;
  try {
    meta = await generateSeoMeta({
      title,
      content,
      category,
      coverImage,
      url: `${SITE_URL}/blog/${slug}`,
      publishedAt,
    });
  } catch (e) {
    console.error("AI metadata generation failed:", e);
    const reason = e instanceof Error ? e.message : "unknown error";
    return { error: `AI metadata generation failed, so nothing was saved. (${reason})` };
  }

  try {
    await prisma.post.create({
      data: {
        slug,
        title,
        coverImage,
        category,
        content,
        seoTitle: meta.seoTitle,
        seoDescription: meta.seoDescription,
        keywords: meta.keywords,
        jsonLd: meta.jsonLd as unknown as Prisma.InputJsonValue,
        publishedAt,
      },
    });
  } catch (e) {
    console.error("Saving post failed:", e);
    return { error: "Database error while saving the post. Check your DATABASE_URL." };
  }

  revalidatePath("/");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
  redirect(`/blog/${slug}`);
}

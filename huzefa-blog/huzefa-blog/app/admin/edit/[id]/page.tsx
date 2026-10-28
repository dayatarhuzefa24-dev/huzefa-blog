import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import PostForm, { type EditorPost } from "../../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;

  const [post, categories] = await Promise.all([prisma.post.findUnique({ where: { id } }), getCategories()]);
  if (!post) notFound();

  const initial: EditorPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    coverImage: post.coverImage,
    category: post.category,
    content: post.content,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    tags: post.keywords.join(", "),
    seoSource: post.seoSource === "manual" || post.seoSource === "auto" ? post.seoSource : "ai",
    status: post.status === "draft" ? "draft" : "published",
    featured: post.featured,
    publishedAtIso: post.publishedAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Edit post</h1>
        <Link href={`/blog/${post.slug}`} className="text-sm font-medium text-red-700 underline">
          {post.status === "draft" ? "Preview" : "View on site"} ↗
        </Link>
      </div>
      <PostForm key={post.id} categories={categories.map((c) => c.name)} post={initial} />
    </div>
  );
}

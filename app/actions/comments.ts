"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CommentState = { error?: string; ok?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Public: a reader leaves a comment. It waits for approval before anyone can see it. */
export async function submitComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  // Hidden "website" box: real people never fill it, bots do.
  if (String(formData.get("website") ?? "").trim()) return { ok: "Thanks! Your comment will appear after it is approved." };

  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").replace(/\s+/g, " ").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();

  if (name.length < 2 || name.length > 60) return { error: "Please enter your name (2–60 characters)." };
  if (email && (email.length > 120 || !EMAIL.test(email))) return { error: "That email address does not look right. You can also leave it empty." };
  if (body.length < 3) return { error: "Please write a comment." };
  if (body.length > 2000) return { error: "Comments can be up to 2000 characters." };
  if ((body.match(/https?:\/\//gi) ?? []).length > 2) return { error: "Comments can include at most 2 links." };

  const jar = await cookies();
  const last = Number(jar.get("c_last")?.value ?? 0);
  if (Date.now() - last < 30_000) return { error: "Please wait half a minute before posting another comment." };

  try {
    const post = await prisma.post.findUnique({ where: { slug }, select: { id: true, status: true, publishedAt: true } });
    if (!post || post.status !== "published" || post.publishedAt > new Date()) return { error: "This story is not open for comments." };
    await prisma.comment.create({ data: { postId: post.id, name, email, body } });
  } catch (e) {
    console.error("Comment save failed:", e);
    return { error: "Comments are not available right now. Please try again later." };
  }

  jar.set("c_last", String(Date.now()), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return { ok: "Thanks! Your comment will appear after it is approved." };
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

/** Admin: approve, mark as spam, or move back to pending. */
export async function setCommentStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && ["approved", "pending", "spam"].includes(status)) {
    try {
      await prisma.comment.update({ where: { id }, data: { status } });
    } catch {
      // comment already deleted
    }
  }
  revalidatePath("/admin/comments");
  revalidatePath("/", "layout");
}

/** Admin: delete one comment for good. */
export async function deleteComment(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    try {
      await prisma.comment.delete({ where: { id } });
    } catch {
      // already gone
    }
  }
  revalidatePath("/admin/comments");
  revalidatePath("/", "layout");
}

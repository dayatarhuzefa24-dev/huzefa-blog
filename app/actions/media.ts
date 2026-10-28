"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Admin: delete an uploaded image — refused while any post still uses it. */
export async function deleteImage(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  if (!/^[\w-]{6,40}$/.test(id)) redirect("/admin/media");
  const url = `/api/img/${id}`;
  const used = await prisma.post.count({
    where: { OR: [{ coverImage: { contains: url } }, { content: { contains: url } }] },
  });
  if (used > 0) redirect("/admin/media?notice=inuse");
  try {
    await prisma.image.delete({ where: { id } });
  } catch {
    // already deleted
  }
  revalidatePath("/admin/media");
  redirect("/admin/media?notice=deleted");
}

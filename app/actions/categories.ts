"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type CategoryState = { error?: string; ok?: string };

const DB_HELP = "Could not reach the Category table. Did you run the upgrade SQL in Neon?";

function cleanName(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function checkName(name: string): string | null {
  if (name.length < 2 || name.length > 40) return "Name must be 2–40 characters.";
  if (!/[a-z0-9]/i.test(name)) return "Name needs at least one letter or number.";
  return null;
}

/** Names must differ, and so must the web addresses made from them ("C++" and "C" would clash). */
async function findClash(name: string, exceptId?: string): Promise<boolean> {
  const all = await prisma.category.findMany({ select: { id: true, name: true } });
  const slug = slugify(name);
  return all.some((c) => c.id !== exceptId && (c.name.toLowerCase() === name.toLowerCase() || slugify(c.name) === slug));
}

function parseOrder(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 9999) : null;
}

export async function createCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  if (!(await isAdmin())) return { error: "Not authorised. Please log in again." };
  const name = cleanName(formData.get("name"));
  const description = String(formData.get("description") ?? "").trim().slice(0, 300);
  const problem = checkName(name);
  if (problem) return { error: problem };

  try {
    if (await findClash(name)) return { error: "A category with this name (or the same web address) already exists." };
    let order = parseOrder(formData.get("sortOrder"));
    if (order === null) {
      const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
      order = (max._max.sortOrder ?? 0) + 1;
    }
    await prisma.category.create({ data: { name, description, sortOrder: order } });
  } catch (e) {
    console.error("createCategory failed:", e);
    return { error: DB_HELP };
  }
  revalidatePath("/", "layout");
  return { ok: `Added “${name}”.` };
}

export async function updateCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  if (!(await isAdmin())) return { error: "Not authorised. Please log in again." };
  const id = String(formData.get("id") ?? "");
  const name = cleanName(formData.get("name"));
  const description = String(formData.get("description") ?? "").trim().slice(0, 300);
  const order = parseOrder(formData.get("sortOrder")) ?? 0;
  const problem = checkName(name);
  if (problem) return { error: problem };

  try {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) return { error: "That category no longer exists." };
    if (await findClash(name, id)) return { error: "Another category already uses this name (or the same web address)." };

    if (current.name === name) {
      await prisma.category.update({ where: { id }, data: { description, sortOrder: order } });
    } else {
      // Posts store the category NAME, so a rename moves every post to the new name.
      await prisma.$transaction([
        prisma.category.update({ where: { id }, data: { name, description, sortOrder: order } }),
        prisma.post.updateMany({ where: { category: current.name }, data: { category: name } }),
      ]);
    }
  } catch (e) {
    console.error("updateCategory failed:", e);
    return { error: DB_HELP };
  }
  revalidatePath("/", "layout");
  return { ok: "Saved." };
}

export async function deleteCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  if (!(await isAdmin())) return { error: "Not authorised. Please log in again." };
  const id = String(formData.get("id") ?? "");
  try {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) return { ok: "Already deleted." };
    const used = await prisma.post.count({ where: { category: current.name } });
    if (used > 0) {
      return {
        error: `“${current.name}” is used by ${used} post${used === 1 ? "" : "s"}. Move ${used === 1 ? "it" : "them"} to another category first (edit the post), then delete.`,
      };
    }
    await prisma.category.delete({ where: { id } });
  } catch (e) {
    console.error("deleteCategory failed:", e);
    return { error: DB_HELP };
  }
  revalidatePath("/", "layout");
  return { ok: "Deleted." };
}

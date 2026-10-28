import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { CATEGORIES } from "./site";
import { slugify } from "./slug";

export type CategoryItem = {
  /** null = fallback default (database table not available yet) */
  id: string | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

function defaults(): CategoryItem[] {
  return CATEGORIES.map((name, i) => ({
    id: null,
    name,
    slug: slugify(name),
    description: "",
    sortOrder: i + 1,
  }));
}

/**
 * All categories, ordered. Falls back to the default six if the Category table
 * has not been created yet, so the public site never breaks during an upgrade.
 */
export const getCategories = cache(async (): Promise<CategoryItem[]> => {
  try {
    const rows = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: slugify(r.name),
      description: r.description,
      sortOrder: r.sortOrder,
    }));
  } catch (e) {
    console.error("Categories unavailable, using defaults:", e);
    return defaults();
  }
});

export async function findCategoryBySlug(slug: string): Promise<CategoryItem | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

import { redirect } from "next/navigation";
import CategoryManager, { type CategoryRowData } from "@/components/admin/CategoryManager";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  if (!(await isAdmin())) redirect("/admin");

  let rows: CategoryRowData[] = [];
  let problem = "";
  try {
    const [cats, counts] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.post.groupBy({ by: ["category"], _count: { _all: true } }),
    ]);
    const used = new Map(counts.map((c) => [c.category, c._count._all]));
    rows = cats.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      posts: used.get(c.name) ?? 0,
    }));
  } catch (e) {
    console.error("Categories page failed:", e);
    problem = "The Category table is missing. Run the upgrade SQL (prisma/upgrade-admin-panel.sql) in Neon's SQL Editor, then reload this page.";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Categories</h1>
      <p className="mb-6 text-sm text-zinc-600">These appear in the site menu, footer, homepage sections and the post editor.</p>
      {problem ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{problem}</p>
      ) : (
        <CategoryManager rows={rows} />
      )}
    </div>
  );
}

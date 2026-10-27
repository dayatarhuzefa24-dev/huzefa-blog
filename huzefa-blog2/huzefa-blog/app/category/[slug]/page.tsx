import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import MostRead from "@/components/MostRead";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import { findCategoryBySlug } from "@/lib/categories";
import { countPosts, getLatest, getMostRead } from "@/lib/queries";
import { SITE_NAME, SITE_URL, categoryHref } from "@/lib/site";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategoryBySlug(slug);
  if (!category) return { title: "Not found" };
  return {
    title: `${category.name} News & Analysis`,
    description: category.description || `Latest ${category.name} stories and analysis by ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}${categoryHref(category.name)}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await findCategoryBySlug(slug);
  if (!category) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [total, posts, mostRead] = await Promise.all([
    countPosts({ category: category.name }),
    getLatest({ take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, category: category.name }),
    getMostRead(5),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.name }]} />
      <h1 className="border-b-2 border-red-600 pb-2 text-3xl font-black uppercase tracking-tight">{category.name}</h1>
      {category.description && <p className="mb-6 mt-3 max-w-2xl text-zinc-600">{category.description}</p>}
      {!category.description && <div className="mb-6" />}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label={`${category.name} stories`}>
          {posts.length === 0 ? (
            <p className="text-zinc-500">No stories in this section yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
          <Pagination basePath={categoryHref(category.name)} page={page} totalPages={Math.ceil(total / PAGE_SIZE)} />
        </section>
        <aside aria-label="Sidebar">
          <div className="sticky top-28">
            <MostRead posts={mostRead} />
          </div>
        </aside>
      </div>
    </div>
  );
}

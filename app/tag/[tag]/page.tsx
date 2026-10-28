import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import { countPosts, getByKeyword } from "@/lib/queries";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
};

function decodeTag(raw: string) {
  try {
    return decodeURIComponent(raw).toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeTag((await params).tag);
  return {
    title: `#${tag}`,
    description: `Stories tagged “${tag}” by ${SITE_NAME}.`,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const tag = decodeTag((await params).tag);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [total, posts] = await Promise.all([
    countPosts({ keyword: tag }),
    getByKeyword(tag, PAGE_SIZE, (page - 1) * PAGE_SIZE),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `#${tag}` }]} />
      <div className="mb-8 border-t-4 border-text pt-4"><h1 className="display text-5xl">#{tag}</h1></div>
      {posts.length === 0 ? (
        <p className="text-muted">No stories with this tag yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
      <Pagination
        basePath={`/tag/${encodeURIComponent(tag)}`}
        page={page}
        totalPages={Math.ceil(total / PAGE_SIZE)}
      />
    </div>
  );
}

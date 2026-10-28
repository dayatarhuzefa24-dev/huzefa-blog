import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import SearchBox from "@/components/SearchBox";
import { searchPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Search result pages shouldn't be indexed (thin / duplicate content).
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true, "max-image-preview": "large" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const results = query.length >= 2 ? await searchPosts(query) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 border-t-4 border-text pt-4"><h1 className="display text-5xl">Search</h1></div>
      <SearchBox defaultValue={query} tone="light" id="page-search" />

      <div className="mt-8">
        {query.length < 2 ? (
          <p className="text-muted">Type at least two characters to search.</p>
        ) : results.length === 0 ? (
          <p className="text-muted">No stories found for “{query}”.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
            </p>
            <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
      <h1 className="mb-4 text-3xl font-black uppercase tracking-tight">Search</h1>
      <SearchBox defaultValue={query} />

      <div className="mt-8">
        {query.length < 2 ? (
          <p className="text-zinc-500">Type at least two characters to search.</p>
        ) : results.length === 0 ? (
          <p className="text-zinc-500">No stories found for “{query}”.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

/** Plain GET form → /search?q=… (works without JavaScript). */
export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" role="search" className="flex w-full max-w-xs">
      <label htmlFor="site-search" className="sr-only">Search stories</label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search stories…"
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
      />
      <button type="submit" className="rounded-r-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
        Search
      </button>
    </form>
  );
}

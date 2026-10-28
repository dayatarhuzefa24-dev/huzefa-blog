/** Plain GET form → /search?q=… (works without JavaScript). Sits on the black masthead. */
export default function SearchBox({ defaultValue = "", tone = "dark", id = "site-search" }: { defaultValue?: string; tone?: "dark" | "light"; id?: string }) {
  const dark = tone === "dark";
  return (
    <form action="/search" role="search" className="flex w-full max-w-sm">
      <label htmlFor={id} className="sr-only">Search stories</label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search stories"
        className={`min-w-0 flex-1 border-b-2 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:opacity-60 focus:border-taxi ${
          dark ? "border-white/40 text-white" : "border-text/40 text-text"
        }`}
      />
      <button type="submit" className="ml-2 px-3 py-1.5 text-sm font-bold text-ink bg-taxi hover:brightness-95">
        Search
      </button>
    </form>
  );
}

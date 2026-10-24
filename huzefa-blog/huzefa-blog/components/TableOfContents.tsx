import type { Heading } from "@/lib/markdown";

/** Collapsible "In this story" list. Only rendered when the article has 3+ headings. */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="In this story" className="my-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <details open>
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-zinc-800">
          In this story
        </summary>
        <ol className="mt-3 space-y-1.5 text-sm">
          {headings.map((h) => (
            <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
              <a href={`#${h.id}`} className="text-zinc-700 hover:text-red-600 hover:underline">
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}

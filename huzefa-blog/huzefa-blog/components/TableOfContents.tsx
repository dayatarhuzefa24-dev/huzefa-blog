import type { Heading } from "@/lib/markdown";

/** Collapsible "In this story" list. Only rendered when the article has 3+ headings. */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="In this story" className="my-6 border-l-4 border-taxi bg-surface p-4">
      <details open>
        <summary className="cursor-pointer text-base font-bold">
          In this story
        </summary>
        <ol className="mt-3 space-y-1.5 text-sm">
          {headings.map((h) => (
            <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
              <a href={`#${h.id}`} className="text-muted hover:text-text hover:underline decoration-taxi decoration-2 underline-offset-4">
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}

import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1">
            {c.href ? (
              <Link href={c.href} className="hover:text-red-600 hover:underline">{c.label}</Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 max-w-[60vw] text-zinc-700">{c.label}</span>
            )}
            {i < items.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

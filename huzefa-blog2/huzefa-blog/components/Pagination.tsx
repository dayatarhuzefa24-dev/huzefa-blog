import Link from "next/link";

export default function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);
  const linkCls = "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:border-zinc-900";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between">
      {page > 1 ? <Link href={href(page - 1)} rel="prev" className={linkCls}>← Newer</Link> : <span />}
      <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} rel="next" className={linkCls}>Older →</Link> : <span />}
    </nav>
  );
}

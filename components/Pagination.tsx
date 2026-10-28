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
  const linkCls = "border-2 border-text px-4 py-2 text-sm font-bold hover:bg-taxi hover:text-ink hover:border-taxi";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between">
      {page > 1 ? <Link href={href(page - 1)} rel="prev" className={linkCls}>Newer stories</Link> : <span />}
      <span className="text-sm text-muted">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} rel="next" className={linkCls}>Older stories</Link> : <span />}
    </nav>
  );
}

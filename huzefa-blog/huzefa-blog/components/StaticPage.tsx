export default function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </header>
      <div className="prose prose-zinc mt-6 max-w-none">{children}</div>
    </article>
  );
}

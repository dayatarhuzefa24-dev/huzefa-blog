export default function StaticPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <header>
        <h1 className="display text-4xl sm:text-5xl">{title}</h1>
        <div className="mt-4 h-1.5 w-16 bg-taxi" aria-hidden />
      </header>
      <div className="page-prose prose mt-8 max-w-none lg:prose-lg">{children}</div>
    </article>
  );
}

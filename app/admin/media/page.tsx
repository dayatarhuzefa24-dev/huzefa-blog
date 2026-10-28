import { redirect } from "next/navigation";
import { deleteImage } from "@/app/actions/media";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { CopyLink, MediaUploader } from "@/components/admin/MediaTools";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/site";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  deleted: "Image deleted.",
  inuse: "That image is still used by a post, so it was not deleted. Remove it from the post first.",
};

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const sp = await searchParams;
  const notice = sp.notice ? NOTICES[sp.notice] : undefined;

  let problem = "";
  let total = 0;
  let totalBytes = 0;
  let images: { id: string; name: string; size: number; createdAt: Date }[] = [];
  const usedIds = new Set<string>();

  try {
    const [count, sums, list, posts] = await Promise.all([
      prisma.image.count(),
      prisma.image.aggregate({ _sum: { size: true } }),
      prisma.image.findMany({ orderBy: { createdAt: "desc" }, take: 60, select: { id: true, name: true, size: true, createdAt: true } }),
      prisma.post.findMany({ select: { coverImage: true, content: true } }),
    ]);
    total = count;
    totalBytes = sums._sum.size ?? 0;
    images = list;
    for (const p of posts) {
      for (const m of `${p.coverImage}\n${p.content}`.matchAll(/\/api\/img\/([\w-]+)/g)) usedIds.add(m[1]);
    }
  } catch (e) {
    console.error("Media page failed:", e);
    problem = "Could not load images. Run prisma/upgrade-v3.sql in Neon's SQL Editor, then reload this page.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Media</h1>
          <p className="mt-1 text-sm text-muted">{total} images, {kb(totalBytes)} used in the database (Neon&apos;s free plan has 512 MB).</p>
        </div>
        <MediaUploader />
      </div>

      {notice && <p className="mb-4 border-l-4 border-taxi bg-surface p-3 text-sm font-semibold" role="status">{notice}</p>}
      {problem && <p className="mb-4 border-l-4 border-signal bg-surface p-3 text-sm text-signal" role="alert">{problem}</p>}

      {images.length === 0 && !problem ? (
        <p className="border border-line bg-surface p-8 text-center text-muted">No images yet. Upload some here, or from the editor.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => {
            const used = usedIds.has(img.id);
            return (
              <li key={img.id} className="border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/img/${img.id}`} alt={img.name || "Uploaded image"} loading="lazy" className="aspect-[4/3] w-full bg-soft object-cover" />
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-semibold" title={img.name}>{img.name || "Untitled"}</p>
                  <p className="text-xs text-muted">{kb(img.size)}, {formatDate(img.createdAt)}</p>
                  <p className="text-xs">
                    {used ? <span className="bg-taxi px-1.5 py-0.5 font-bold text-ink">Used in a post</span> : <span className="text-muted">Not used</span>}
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <CopyLink path={`/api/img/${img.id}`} />
                    <ConfirmButton action={deleteImage} id={img.id} label="Delete" message="Delete this image for good?" className="text-sm font-semibold text-signal hover:underline" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {total > images.length && <p className="mt-4 text-xs text-muted">Showing the newest {images.length} of {total}.</p>}
    </div>
  );
}

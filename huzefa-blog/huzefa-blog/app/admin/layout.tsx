import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

// The dashboard must never be indexed.
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    "max-image-preview": "large",
  },
};

async function pendingComments(): Promise<number> {
  try {
    return await prisma.comment.count({ where: { status: "pending" } });
  } catch {
    return 0; // comments table not created yet
  }
}

const link = "px-3 py-3 hover:text-taxi";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isAdmin();
  const pending = loggedIn ? await pendingComments() : 0;
  return (
    <div className="admin-root force-light min-h-screen bg-bg text-text">
      {loggedIn && (
        <header className="border-b-[3px] border-taxi bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 px-2 text-sm">
            <Link href="/admin" className="display px-3 py-3 text-lg">
              Admin <span className="ml-1 bg-taxi px-1.5 py-0.5 align-middle text-[0.65rem] font-bold text-ink">v{APP_VERSION}</span>
            </Link>
            <nav aria-label="Admin" className="flex flex-wrap font-semibold">
              <Link href="/admin" className={link}>Posts</Link>
              <Link href="/admin/new" className={link}>New post</Link>
              <Link href="/admin/comments" className={link}>
                Comments
                {pending > 0 && <span className="ml-1.5 bg-taxi px-1.5 py-0.5 text-xs font-bold text-ink">{pending}</span>}
              </Link>
              <Link href="/admin/subscribers" className={link}>Subscribers</Link>
              <Link href="/admin/media" className={link}>Media</Link>
              <Link href="/admin/categories" className={link}>Categories</Link>
              <Link href="/admin/analytics" className={link}>Analytics</Link>
              <Link href="/" className={link}>View site ↗</Link>
            </nav>
            <form action={logout} className="ml-auto pr-3">
              <button type="submit" className="text-white/70 underline hover:text-white">Log out</button>
            </form>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}

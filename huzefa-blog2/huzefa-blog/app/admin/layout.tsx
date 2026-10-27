import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { isAdmin } from "@/lib/auth";

// The dashboard must never be indexed.
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    "max-image-preview": "large",
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isAdmin();
  return (
    <div className="min-h-screen bg-zinc-50">
      {loggedIn && (
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm">
            <Link href="/admin" className="font-bold">Admin</Link>
            <nav aria-label="Admin" className="flex flex-wrap gap-x-5 gap-y-1 font-medium text-zinc-700">
              <Link href="/admin" className="hover:text-red-600">Posts</Link>
              <Link href="/admin/new" className="hover:text-red-600">New post</Link>
              <Link href="/admin/categories" className="hover:text-red-600">Categories</Link>
              <Link href="/" className="hover:text-red-600">View site ↗</Link>
            </nav>
            <form action={logout} className="ml-auto">
              <button type="submit" className="text-zinc-600 underline">Log out</button>
            </form>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SearchBox from "@/components/SearchBox";
import {
  CATEGORIES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  categoryHref,
  formatToday,
} from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const robots = {
  index: true,
  follow: true,
  // Required for large thumbnails in Google Discover.
  "max-image-preview": "large" as const,
  "max-snippet": -1,
  "max-video-preview": -1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Tech, AI, Mumbai Real Estate, Sensex, Gaming & Bollywood`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { types: { "application/rss+xml": `${SITE_URL}/feed.xml` } },
  // Renders: <meta name="robots" content="index, follow, max-image-preview:large, …">
  robots: { ...robots, googleBot: robots },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN" },
  twitter: { card: "summary_large_image", creator: SITE_NAME },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="bg-zinc-900 text-xs text-zinc-300">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
            <span>{formatToday()}</span>
            <Link href="/feed.xml" className="hover:text-white">RSS</Link>
          </div>
        </div>

        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-2xl font-black uppercase tracking-tight">
              {SITE_NAME}
            </Link>
            <SearchBox />
          </div>
          <nav aria-label="Categories" className="border-t border-zinc-100">
            <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2 text-sm font-semibold whitespace-nowrap">
              <li><Link href="/" className="hover:text-red-600">Home</Link></li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href={categoryHref(c)} className="hover:text-red-600">{c}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 bg-zinc-900 text-zinc-300">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
            <div>
              <p className="text-lg font-black uppercase text-white">{SITE_NAME}</p>
              <p className="mt-2 text-sm">{SITE_DESCRIPTION}</p>
            </div>
            <nav aria-label="Sections">
              <p className="text-sm font-bold uppercase tracking-wide text-white">Sections</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {CATEGORIES.map((c) => (
                  <li key={c}><Link href={categoryHref(c)} className="hover:text-white">{c}</Link></li>
                ))}
              </ul>
            </nav>
            <div className="space-y-6">
              <nav aria-label="Footer">
                <p className="text-sm font-bold uppercase tracking-wide text-white">Company</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                  <li><Link href="/feed.xml" className="hover:text-white">RSS feed</Link></li>
                </ul>
              </nav>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-white">Follow</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {SOCIAL_LINKS.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer me" className="hover:text-white">{s.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}

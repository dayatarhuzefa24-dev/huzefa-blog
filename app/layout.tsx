import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { connection } from "next/server";
import "./globals.css";
import SearchBox from "@/components/SearchBox";
import SubscribeForm from "@/components/SubscribeForm";
import { getCategories } from "@/lib/categories";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  categoryHref,
  formatToday,
} from "@/lib/site";

// Headlines and interface: Bricolage Grotesque. Article text: Source Serif 4.
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const body = Source_Serif_4({ variable: "--font-body", subsets: ["latin"], display: "swap" });

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The menu comes from the database, so render on every request (never bake it in at build time).
  await connection();
  const categories = await getCategories();

  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-taxi focus:px-3 focus:py-2 focus:text-ink">
          Skip to content
        </a>

        {/* Masthead */}
        <div className="site-chrome bg-ink text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4 pb-4 pt-5">
            <div>
              <p className="text-xs text-white/55">{formatToday()}</p>
              <Link href="/" className="display mt-1 block text-[2rem] uppercase leading-none sm:text-5xl">
                {SITE_NAME}
              </Link>
            </div>
            <div className="flex w-full items-center gap-5 sm:w-auto">
              <SearchBox />
              <a href="#subscribe" className="hidden shrink-0 text-sm font-bold text-taxi hover:underline sm:block">Newsletter</a>
            </div>
          </div>
        </div>

        {/* Section bar: stays on screen while scrolling */}
        <nav aria-label="Categories" className="site-chrome sticky top-0 z-30 border-b-[3px] border-taxi bg-ink text-white">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 text-[0.95rem] font-semibold whitespace-nowrap">
            <li><Link href="/" className="block px-3 py-3 hover:text-taxi">Home</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={categoryHref(c.name)} className="block px-3 py-3 hover:text-taxi">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="flex-1">{children}</main>

        <footer className="site-chrome mt-20 bg-ink text-white/80">
          <div id="subscribe" className="border-b border-white/15">
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div>
                <h2 className="display text-3xl text-white sm:text-4xl">New stories, straight to your inbox.</h2>
                <p className="mt-3 max-w-md font-[family-name:var(--font-body)] text-base text-white/65">
                  Tech, AI, Mumbai property, the Sensex, games and Bollywood. No spam, and you can leave any time.
                </p>
              </div>
              <SubscribeForm source="footer" tone="dark" />
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
            <div>
              <p className="display text-xl uppercase text-white">{SITE_NAME}</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">{SITE_DESCRIPTION}</p>
            </div>
            <nav aria-label="Sections">
              <p className="text-sm font-bold text-white">Sections</p>
              <ul className="mt-3 space-y-2 text-sm">
                {categories.map((c) => (
                  <li key={c.slug}><Link href={categoryHref(c.name)} className="hover:text-taxi">{c.name}</Link></li>
                ))}
              </ul>
            </nav>
            <div className="space-y-8">
              <nav aria-label="Footer">
                <p className="text-sm font-bold text-white">About the site</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/privacy-policy" className="hover:text-taxi">Privacy Policy</Link></li>
                  <li><Link href="/terms-of-service" className="hover:text-taxi">Terms of Service</Link></li>
                  <li><Link href="/contact" className="hover:text-taxi">Contact</Link></li>
                  <li><Link href="/feed.xml" className="hover:text-taxi">RSS feed</Link></li>
                </ul>
              </nav>
              <div>
                <p className="text-sm font-bold text-white">Follow</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {SOCIAL_LINKS.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer me" className="hover:text-taxi">{s.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}

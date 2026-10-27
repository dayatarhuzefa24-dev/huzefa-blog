// Single place for brand + site constants. Everything on the site (header, footer,
// bylines, metadata, JSON-LD, RSS) reads the name from here.
import { slugify } from "./slug";

export const SITE_NAME = "Huzefa Dayatar";
// Used in NewsArticle JSON-LD (author.name), bylines, RSS <dc:creator>.
export const AUTHOR_NAME = "Huzefa Dayatar";
export const AUTHOR_BIO =
  "Huzefa Dayatar writes about technology, AI, Mumbai real estate, the BSE Sensex, gaming and Bollywood.";
export const SITE_DESCRIPTION =
  "Tech, AI, Mumbai real estate, BSE Sensex, gaming and Bollywood — written by Huzefa Dayatar.";

// TODO: put your real profiles here; the footer and author box link to them.
export const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
];

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * DEFAULT categories. The live list is stored in the database and edited at
 * /admin/categories; this list is only the starting set and the fallback used
 * if the database table is not available.
 */
export const CATEGORIES = [
  "Tech",
  "AI",
  "Mumbai Real Estate",
  "BSE Sensex",
  "Gaming",
  "Bollywood",
] as const;

export const categorySlug = (c: string) => slugify(c);
/** A category's page address is always derived from its name. */
export const categoryHref = (c: string) => `/category/${slugify(c)}`;

/** "/api/img/abc" -> "https://yourdomain.com/api/img/abc"; full URLs are returned unchanged. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

const IST = "Asia/Kolkata";

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
}

export function formatDateTime(date: Date) {
  const d = formatDate(date);
  const t = date
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: IST })
    .toUpperCase();
  return `${d}, ${t} IST`;
}

export function formatToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: IST,
  });
}

/** 1234 -> "1.2K", 15300 -> "15.3K", 2400000 -> "2.4M" */
export function formatCount(n: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

// Pure helpers for SEO metadata. Used by the AI step, by manual publishing and by edits.
import { AUTHOR_NAME, SITE_NAME, SITE_URL, absoluteUrl } from "./site";

/** Collapse whitespace and cut to `max` chars on a word boundary. */
export function clamp(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return safe.replace(/[\s,.;:-]+$/, "") + "…";
}

/** Lowercase, trimmed, de-duplicated tags. Order is kept, so earlier tags win. */
export function cleanTags(raw: unknown, max = 15): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of raw) {
    if (typeof k !== "string") continue;
    const v = k.trim().replace(/^#+/, "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 40);
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out.slice(0, max);
}

/** "tech, AI  ,#Sensex" -> ["tech","ai","sensex"] (comma or new line separated) */
export function parseTags(input: string): string[] {
  return cleanTags(input.split(/[,\n]/));
}

/** The author's own tags first (they are always kept), then extra ones from the AI. */
export function mergeTags(mine: string[], others: string[], max = 15): string[] {
  return cleanTags([...mine, ...others], max);
}

/** Markdown -> plain text (for an automatic meta description). */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoDescription(markdown: string): string {
  return clamp(plainText(markdown), 155);
}

/** URLs of all images used inside the Markdown body, in order. */
export function extractImages(markdown: string): string[] {
  const out: string[] = [];
  const re = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown))) out.push(m[1]);
  return out;
}

type LdContext = {
  title: string;
  seoDescription: string;
  keywords: string[];
  category: string;
  /** Absolute or site-relative URL of the cover image */
  coverImage: string;
  /** Images inside the article body (site-relative or absolute) */
  images: string[];
  url: string;
  publishedAt: Date;
  modifiedAt: Date;
};

/**
 * Builds the NewsArticle JSON-LD. `drafted` (from the AI, or the previously saved
 * JSON-LD) can contribute extra fields, but everything Google validates —
 * url, dates, images, author, publisher, headline — is always set from trusted values.
 */
export function finalizeJsonLd(drafted: unknown, ctx: LdContext): Record<string, unknown> {
  const base =
    drafted && typeof drafted === "object" && !Array.isArray(drafted)
      ? (drafted as Record<string, unknown>)
      : {};
  const images = Array.from(new Set([ctx.coverImage, ...ctx.images].filter(Boolean).map(absoluteUrl))).slice(0, 8);

  return {
    ...base,
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": ctx.url },
    headline: clamp(ctx.title, 110), // Google truncates headlines past 110 chars
    description: ctx.seoDescription,
    image: images,
    datePublished: ctx.publishedAt.toISOString(),
    dateModified: ctx.modifiedAt.toISOString(),
    author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    keywords: ctx.keywords.join(", "),
    articleSection: ctx.category,
    inLanguage: "en-IN",
  };
}

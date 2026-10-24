import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { AUTHOR_NAME, SITE_NAME, SITE_URL } from "./site";

export type SeoMeta = {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  jsonLd: Record<string, unknown>;
};

type Input = {
  title: string;
  content: string;
  category: string;
  coverImage: string;
  url: string;
  publishedAt: Date;
};

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

/** Collapse whitespace and cut to `max` chars on a word boundary. */
function clamp(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return safe.replace(/[\s,.;:-]+$/, "") + "…";
}

function cleanKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of raw) {
    if (typeof k !== "string") continue;
    const v = k.trim().toLowerCase();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out.slice(0, 10);
}

/**
 * The model drafts the JSON-LD, but we always overwrite the fields Google
 * actually validates (url, dates, image, author, publisher) with trusted
 * server-side values so a hallucination can't break rich results.
 */
function finalizeJsonLd(
  drafted: unknown,
  ctx: Input & { seoTitle: string; seoDescription: string; keywords: string[] },
): Record<string, unknown> {
  const base =
    drafted && typeof drafted === "object" && !Array.isArray(drafted)
      ? (drafted as Record<string, unknown>)
      : {};
  const iso = ctx.publishedAt.toISOString();
  const draftedHeadline =
    typeof base.headline === "string" && base.headline.trim() ? base.headline : ctx.title;

  return {
    ...base,
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": ctx.url },
    headline: clamp(draftedHeadline, 110), // Google truncates headlines past 110 chars
    description: ctx.seoDescription,
    image: [ctx.coverImage],
    datePublished: iso,
    dateModified: iso,
    author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    keywords: ctx.keywords.join(", "),
    articleSection: ctx.category,
    inLanguage: "en-IN",
  };
}

export async function generateSeoMeta(input: Input): Promise<SeoMeta> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a senior SEO editor for a news-style blog optimised for Google News and Google Discover.

Given the article below, return JSON with:
- seoTitle: compelling, accurate, max 60 characters, primary keyword near the start, no clickbait lies.
- seoDescription: compelling summary, STRICTLY under 160 characters, no quotes.
- keywords: 5-10 lowercase keywords/tags (short phrases).
- jsonLd: a STRINGIFIED JSON object that is a complete schema.org NewsArticle with: "@context", "@type":"NewsArticle", headline (max 110 chars), description, image (array), datePublished, dateModified, author {"@type":"Person","name":"${AUTHOR_NAME}"}, publisher {"@type":"Organization","name":"${SITE_NAME}"}, mainEntityOfPage, keywords, articleSection.

Use these exact values in the JSON-LD:
- url: ${input.url}
- image: ["${input.coverImage}"]
- datePublished and dateModified: ${input.publishedAt.toISOString()}
- articleSection: ${input.category}

Title: ${input.title}
Category: ${input.category}

Article (Markdown):
"""
${input.content.slice(0, 12000)}
"""`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          seoTitle: { type: Type.STRING },
          seoDescription: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          jsonLd: { type: Type.STRING },
        },
        required: ["seoTitle", "seoDescription", "keywords", "jsonLd"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("The AI returned an empty response.");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The AI returned invalid JSON.");
  }

  const seoTitle = clamp(String(parsed.seoTitle ?? input.title), 60);
  const seoDescription = clamp(String(parsed.seoDescription ?? ""), 160);
  if (!seoDescription) throw new Error("The AI did not return a meta description.");
  const keywords = cleanKeywords(parsed.keywords);

  let drafted: unknown = null;
  try {
    drafted = typeof parsed.jsonLd === "string" ? JSON.parse(parsed.jsonLd) : parsed.jsonLd;
  } catch {
    // Fall through: finalizeJsonLd builds a valid object from trusted values.
  }

  const jsonLd = finalizeJsonLd(drafted, { ...input, seoTitle, seoDescription, keywords });

  return { seoTitle, seoDescription, keywords, jsonLd };
}

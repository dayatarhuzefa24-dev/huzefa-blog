import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { clamp, cleanTags, finalizeJsonLd, mergeTags } from "./seo";
import { AUTHOR_NAME, SITE_NAME, absoluteUrl } from "./site";

export type SeoMeta = {
  seoTitle: string;
  seoDescription: string;
  /** The author's tags first, then the AI's */
  keywords: string[];
  jsonLd: Record<string, unknown>;
};

type Input = {
  title: string;
  content: string;
  category: string;
  coverImage: string;
  images: string[];
  url: string;
  publishedAt: Date;
  modifiedAt: Date;
  /** Tags typed by the author. They are always kept and the AI is told to include them. */
  requiredTags: string[];
  /** If the author typed these, they win over what the AI writes. */
  fixedSeoTitle?: string;
  fixedSeoDescription?: string;
};

// Google retires older models for new accounts, so this can be changed without code:
// set GEMINI_MODEL in Vercel -> Settings -> Environment Variables.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

export async function generateSeoMeta(input: Input): Promise<SeoMeta> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const ai = new GoogleGenAI({ apiKey });

  const tagsLine = input.requiredTags.length
    ? `The author chose these tags. Include every one of them, exactly as written, in "keywords" and keep them in the JSON-LD keywords: ${input.requiredTags.join(", ")}`
    : "The author did not choose tags, so pick them yourself.";

  const prompt = `You are a senior SEO editor for a news-style blog optimised for Google News and Google Discover.

Given the article below, return JSON with:
- seoTitle: compelling, accurate, max 60 characters, primary keyword near the start, no clickbait lies.
- seoDescription: compelling summary, STRICTLY under 160 characters, no quotes.
- keywords: 5-10 lowercase keywords/tags (short phrases). ${tagsLine}
- jsonLd: a STRINGIFIED JSON object that is a complete schema.org NewsArticle with: "@context", "@type":"NewsArticle", headline (max 110 chars), description, image (array), datePublished, dateModified, author {"@type":"Person","name":"${AUTHOR_NAME}"}, publisher {"@type":"Organization","name":"${SITE_NAME}"}, mainEntityOfPage, keywords, articleSection.

Use these exact values in the JSON-LD:
- url: ${input.url}
- image: ${JSON.stringify([input.coverImage, ...input.images].map(absoluteUrl).slice(0, 8))}
- datePublished: ${input.publishedAt.toISOString()}
- dateModified: ${input.modifiedAt.toISOString()}
- articleSection: ${input.category}
${input.fixedSeoTitle ? `- The author already wrote the meta title; use exactly: ${input.fixedSeoTitle}\n` : ""}${input.fixedSeoDescription ? `- The author already wrote the meta description; use exactly: ${input.fixedSeoDescription}\n` : ""}
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

  // The author's own words always win over the AI's.
  const seoTitle = clamp(input.fixedSeoTitle || String(parsed.seoTitle ?? input.title), 60);
  const seoDescription = clamp(input.fixedSeoDescription || String(parsed.seoDescription ?? ""), 160);
  if (!seoDescription) throw new Error("The AI did not return a meta description.");

  // Author's tags first (guaranteed), then the AI's extras.
  const keywords = mergeTags(input.requiredTags, cleanTags(parsed.keywords, 15));

  let drafted: unknown = null;
  try {
    drafted = typeof parsed.jsonLd === "string" ? JSON.parse(parsed.jsonLd) : parsed.jsonLd;
  } catch {
    // Fall through: finalizeJsonLd builds a valid object from trusted values.
  }

  const jsonLd = finalizeJsonLd(drafted, {
    title: input.title,
    seoDescription,
    keywords,
    category: input.category,
    coverImage: input.coverImage,
    images: input.images,
    url: input.url,
    publishedAt: input.publishedAt,
    modifiedAt: input.modifiedAt,
  });

  return { seoTitle, seoDescription, keywords, jsonLd };
}

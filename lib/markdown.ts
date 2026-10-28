import GithubSlugger from "github-slugger";
import remarkParse from "remark-parse";
import { unified } from "unified";

type Node = { type: string; value?: string; depth?: number; children?: Node[] };

export type Heading = { id: string; text: string; level: 2 | 3 };

function nodeText(node: Node): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

function walk(node: Node, visit: (n: Node) => void) {
  visit(node);
  node.children?.forEach((c) => walk(c, visit));
}

/**
 * h2/h3 headings for the table of contents. Ids are produced with github-slugger in
 * document order over ALL headings — exactly what `rehype-slug` does when rendering —
 * so TOC links always match the ids on the page, including duplicate headings.
 */
export function extractHeadings(markdown: string): Heading[] {
  const tree = unified().use(remarkParse).parse(markdown) as unknown as Node;
  const slugger = new GithubSlugger();
  const out: Heading[] = [];
  walk(tree, (n) => {
    if (n.type !== "heading" || !n.depth) return;
    const text = nodeText(n).trim();
    const id = slugger.slug(text);
    if (n.depth === 2 || n.depth === 3) out.push({ id, text, level: n.depth });
  });
  return out;
}

export function wordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingTimeMinutes(markdown: string): number {
  return Math.max(1, Math.round(wordCount(markdown) / 200));
}

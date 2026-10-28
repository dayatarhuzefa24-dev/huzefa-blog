import type { Element } from "hast";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import { rehypeAdAfterParagraph } from "@/lib/rehype-ad";
import AdSlot from "./AdSlot";

const isImg = (n: { type: string; tagName?: string }) => n.type === "element" && n.tagName === "img";

const components: Components = {
  a: ({ href, children }) => {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  },

  // A paragraph holding only an image becomes a <figure> directly (a <figure> inside <p> is invalid HTML).
  p: ({ node, children }) => {
    const kids = ((node as Element | undefined)?.children ?? []).filter(
      (c) => !(c.type === "text" && !c.value.trim()),
    );
    if (kids.length === 1 && isImg(kids[0] as Element)) return <>{children}</>;
    if (kids.some((c) => isImg(c as Element))) return <div>{children}</div>;
    return <p>{children}</p>;
  },

  // ![alt text](url "optional caption")  ->  <figure><img><figcaption>caption</figcaption></figure>
  img: ({ src, alt, title }) => {
    if (typeof src !== "string" || !src) return null;
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- images can come from any host */}
        <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="mx-auto h-auto max-w-full" />
        {title ? <figcaption>{title}</figcaption> : null}
      </figure>
    );
  },

  // The rehype plugin emits <div data-ad-slot="…">; render it as an ad container.
  div: (props) => {
    const slot = (props as Record<string, unknown>)["data-ad-slot"];
    if (typeof slot === "string") {
      return (
        <>
          {/* ADSENSE: in-article unit (after paragraph 3) */}
          <AdSlot slot={slot} />
        </>
      );
    }
    return <div>{props.children}</div>;
  },
};

const withAds: PluggableList = [rehypeSlug, [rehypeAdAfterParagraph, { after: 3, slot: "in-article-1" }]];
const withoutAds: PluggableList = [rehypeSlug];

/** Renders article Markdown. Used by the public article page (with ads) and the editor preview (without). */
export default function MarkdownView({ children, ads = false }: { children: string; ads?: boolean }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={ads ? withAds : withoutAds} components={components}>
      {children}
    </ReactMarkdown>
  );
}

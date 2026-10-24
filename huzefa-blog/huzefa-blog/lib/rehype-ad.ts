type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/**
 * rehype plugin: inserts <div data-ad-slot="…"> after the n-th top-level paragraph.
 * The article page maps that div to the <AdSlot /> component. Raw HTML in Markdown is
 * not enabled, so authors cannot create these divs themselves.
 */
export function rehypeAdAfterParagraph(options: { after: number; slot: string }) {
  return (tree: HastNode) => {
    let count = 0;
    const children = tree.children ?? [];
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.type === "element" && node.tagName === "p") {
        count += 1;
        if (count === options.after) {
          children.splice(i + 1, 0, {
            type: "element",
            tagName: "div",
            properties: { "data-ad-slot": options.slot },
            children: [],
          });
          return;
        }
      }
    }
  };
}

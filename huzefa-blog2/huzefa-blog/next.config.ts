import type { NextConfig } from "next";

// NOTE: `cacheComponents` / `partialPrefetching` (enabled by the Next 16 starter)
// are intentionally removed. This blog relies on classic SSR via
// `export const dynamic = "force-dynamic"` so new posts show up instantly.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

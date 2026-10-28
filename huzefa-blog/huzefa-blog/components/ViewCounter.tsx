"use client";

import { useEffect, useRef, useState } from "react";
import { formatCount } from "@/lib/site";

/**
 * Shows the view count and registers this visit once per page load.
 * The server de-duplicates per visitor (24h cookie) and ignores bots.
 */
export default function ViewCounter({ slug, initialViews }: { slug: string; initialViews: number }) {
  const [views, setViews] = useState(initialViews);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/posts/${slug}/view`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { views?: number } | null) => {
        if (d && typeof d.views === "number") setViews(d.views);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted" title={`${views.toLocaleString("en-IN")} views`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>{formatCount(views)} views</span>
    </span>
  );
}

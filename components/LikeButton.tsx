"use client";

import { useState } from "react";
import { formatCount } from "@/lib/site";

export default function LikeButton({
  slug,
  initialLikes,
  initiallyLiked,
}: {
  slug: string;
  initialLikes: number;
  initiallyLiked: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initiallyLiked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    // Optimistic update, rolled back if the request fails.
    setLiked(next);
    setLikes((l) => Math.max(0, l + (next ? 1 : -1)));
    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ like: next }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { likes: number; liked: boolean };
      setLikes(data.likes);
      setLiked(data.liked);
    } catch {
      setLiked(!next);
      setLikes((l) => Math.max(0, l + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this story" : "Like this story"}
      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm font-semibold transition ${
        liked ? "border-signal text-signal" : "border-line text-text hover:border-ink hover:bg-taxi hover:text-ink"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.5 11.8 19.5 16.4 12 21 12 21Z" />
      </svg>
      <span>{formatCount(likes)}</span>
    </button>
  );
}

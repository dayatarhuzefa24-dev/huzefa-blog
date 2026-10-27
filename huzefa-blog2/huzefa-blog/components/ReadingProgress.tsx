"use client";

import { useEffect, useState } from "react";

/** Thin red bar under the header showing how far through #article-body the reader is. */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("article-body");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = Math.max(rect.height - window.innerHeight * 0.5, 1);
      setProgress(Math.min(Math.max(-rect.top / total, 0), 1) * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
    >
      <div className="h-full bg-red-600 transition-[width] duration-100" style={{ width: `${progress}%` }} />
    </div>
  );
}

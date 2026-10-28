"use client";

import { useState } from "react";

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const btn = "border border-line px-3 py-1.5 text-xs font-semibold text-text hover:border-ink hover:bg-taxi hover:text-ink";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this story">
      <span className="mr-1 text-sm font-semibold text-muted">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={btn}>
          {l.label}
        </a>
      ))}
      <button type="button" onClick={copy} className={btn}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}

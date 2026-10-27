"use client";

import { useState } from "react";

export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, cls: "bg-green-600" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, cls: "bg-zinc-900" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, cls: "bg-blue-600" },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, cls: "bg-sky-700" },
    { label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}`, cls: "bg-sky-500" },
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

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this story">
      <span className="text-sm font-medium text-zinc-600">Share</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 ${l.cls}`}
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-zinc-900"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

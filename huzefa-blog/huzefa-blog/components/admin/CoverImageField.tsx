"use client";

import { useRef, useState } from "react";
import { ACCEPTED_TYPES, uploadImage } from "@/lib/image-client";

/** Cover image: upload from your computer, or paste a link. Submits as the form field "coverImage". */
export default function CoverImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of any host */}
          <img src={value} alt="Cover preview" className="aspect-video w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white hover:bg-black"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:border-zinc-900 disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Upload from computer"}
        </button>
        <span className="text-sm text-zinc-500">or paste a link:</span>
        <input
          type="text"
          name="coverImage"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          aria-label="Cover image link"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <p className="text-xs text-zinc-500">Tip: a wide photo (at least 1200 px) works best for Google Discover.</p>
    </div>
  );
}

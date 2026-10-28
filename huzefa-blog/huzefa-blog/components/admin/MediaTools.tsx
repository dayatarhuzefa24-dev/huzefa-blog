"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ACCEPTED_TYPES, uploadImage } from "@/lib/image-client";

/** Upload several pictures at once from the media page. */
export function MediaUploader() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg("");
    const errors: string[] = [];
    let done = 0;
    for (const f of Array.from(files)) {
      try {
        await uploadImage(f);
        done++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Upload failed.");
      }
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
    setMsg(`${done} uploaded.${errors.length ? ` ${errors.join(" ")}` : ""}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="border-2 border-ink bg-taxi px-4 py-2 text-sm font-bold text-ink hover:brightness-95 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload images"}
      </button>
      <input ref={ref} type="file" multiple accept={ACCEPTED_TYPES} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </div>
  );
}

/** Copies an image's address so it can be pasted anywhere. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const full = `${window.location.origin}${path}`;
        try {
          await navigator.clipboard.writeText(full);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy this link:", full);
        }
      }}
      className="text-sm font-semibold hover:underline"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

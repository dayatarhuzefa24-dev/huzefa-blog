"use client";

import { useRef, useState } from "react";
import { ACCEPTED_TYPES, uploadImage } from "@/lib/image-client";

type Item = {
  key: string;
  name: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
  alt: string;
  caption: string;
};

/** ![alt](url "caption") — the standard Markdown image, with the caption as its title. */
function mdImage(url: string, alt: string, caption: string): string {
  const a = alt.replace(/[[\]\r\n]/g, " ").replace(/\s+/g, " ").trim();
  const c = caption.replace(/"/g, "'").replace(/\s+/g, " ").trim();
  const u = /[\s()]/.test(url) ? `<${url}>` : url;
  return `![${a}](${u}${c ? ` "${c}"` : ""})`;
}

const input = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900";

export default function ImageInsertModal({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "link">("upload");
  const [items, setItems] = useState<Item[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkAlt, setLinkAlt] = useState("");
  const [linkCaption, setLinkCaption] = useState("");
  const [linkError, setLinkError] = useState("");

  if (!open) return null;

  const uploading = items.some((i) => i.status === "uploading");
  const ready = items.filter((i) => i.status === "done");

  function reset() {
    setItems([]);
    setLinkUrl("");
    setLinkAlt("");
    setLinkCaption("");
    setLinkError("");
    setTab("upload");
  }
  function close() {
    reset();
    onClose();
  }
  const patch = (key: string, p: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((list) => [...list, { key, name: file.name, status: "uploading", alt: "", caption: "" }]);
      uploadImage(file)
        .then(({ url }) => patch(key, { status: "done", url }))
        .catch((e: unknown) => patch(key, { status: "error", error: e instanceof Error ? e.message : "Upload failed." }));
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function insertUploaded() {
    onInsert(ready.map((i) => mdImage(i.url as string, i.alt, i.caption)).join("\n\n"));
    reset();
  }

  function insertLink() {
    const url = linkUrl.trim();
    if (!/^https?:\/\/\S+$/i.test(url) && !url.startsWith("/api/img/")) {
      setLinkError("Paste a full image link starting with https://");
      return;
    }
    onInsert(mdImage(url, linkAlt, linkCaption));
    reset();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Insert images"
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Insert images</h2>
          <button type="button" onClick={close} className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100">
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-1 text-sm">
          {(["upload", "link"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 font-medium ${tab === t ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}
            >
              {t === "upload" ? "Upload from computer" : "Paste a link"}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-zinc-300 px-4 py-8 text-sm text-zinc-600 hover:border-zinc-900"
            >
              Click to choose one or more images (JPG, PNG, WebP, GIF)
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />

            {items.map((i) => (
              <div key={i.key} className="flex gap-3 rounded-lg border border-zinc-200 p-3">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded bg-zinc-100">
                  {i.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- own uploaded image
                    <img src={i.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      {i.status === "error" ? "Failed" : "Uploading…"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-xs text-zinc-500">{i.name}</p>
                  {i.status === "error" ? (
                    <p className="text-sm text-red-600">{i.error}</p>
                  ) : (
                    <>
                      <input
                        className={input}
                        placeholder="Describe the image (alt text — helps Google & screen readers)"
                        value={i.alt}
                        onChange={(e) => patch(i.key, { alt: e.target.value })}
                      />
                      <input
                        className={input}
                        placeholder="Caption (optional)"
                        value={i.caption}
                        onChange={(e) => patch(i.key, { caption: e.target.value })}
                      />
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setItems((l) => l.filter((x) => x.key !== i.key))}
                  className="self-start text-xs text-zinc-500 hover:text-red-600"
                  aria-label={`Remove ${i.name}`}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={insertUploaded}
              disabled={uploading || ready.length === 0}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {uploading ? "Uploading…" : `Insert ${ready.length || ""} image${ready.length === 1 ? "" : "s"}`}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input className={input} placeholder="https://example.com/photo.jpg" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <input className={input} placeholder="Describe the image (alt text)" value={linkAlt} onChange={(e) => setLinkAlt(e.target.value)} />
            <input className={input} placeholder="Caption (optional)" value={linkCaption} onChange={(e) => setLinkCaption(e.target.value)} />
            {linkError && <p className="text-sm text-red-600" role="alert">{linkError}</p>}
            <button type="button" onClick={insertLink} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Insert image
            </button>
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          The image is added where your cursor is. Use it as many times as you like, anywhere in the post.
        </p>
      </div>
    </div>
  );
}

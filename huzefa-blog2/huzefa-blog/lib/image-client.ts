// Browser-only helpers: shrink a photo before upload and send it to /api/admin/upload.
// Phone photos are often 5-10 MB; Vercel only accepts ~4.5 MB per request, so we resize
// to at most 2000 px wide (still plenty for Google Discover, which wants 1200 px+).

const MAX_SIDE = 2000;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file; // keep animation as-is

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // e.g. a format the browser can't decode; the server will check it
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob || blob.type !== "image/webp") return file;
  // Keep the original if it was already smaller (e.g. a tiny PNG).
  if (blob.size >= file.size && scale === 1) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${name}.webp`, { type: "image/webp" });
}

export type UploadResult = { url: string };

/** Resizes (if needed) and uploads one image. Throws an Error with a readable message. */
export async function uploadImage(file: File): Promise<UploadResult> {
  const ready = await prepareImage(file);
  if (ready.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is too large (max 4 MB after resizing).`);
  }
  const body = new FormData();
  body.append("file", ready);

  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST", body });
  } catch {
    throw new Error("Upload failed. Check your internet connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return { url: data.url };
}

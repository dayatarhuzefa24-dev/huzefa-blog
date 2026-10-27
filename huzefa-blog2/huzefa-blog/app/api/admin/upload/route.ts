import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel rejects request bodies above ~4.5 MB

/** Work out the real image type from the first bytes — never trust the file name or declared type. */
function sniff(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  const head = b.subarray(0, 6).toString("latin1");
  if (head === "GIF87a" || head === "GIF89a") return "image/gif";
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised. Please log in again." }, { status: 401 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 4 MB." }, { status: 413 });

  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniff(data);
  if (!contentType) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF images are allowed." }, { status: 415 });
  }

  const id = randomBytes(9).toString("base64url");
  try {
    await prisma.image.create({ data: { id, data, contentType, size: data.length } });
  } catch (e) {
    console.error("Image save failed:", e);
    return NextResponse.json(
      { error: "Could not save the image. Did you run the upgrade SQL in Neon?" },
      { status: 500 },
    );
  }
  return NextResponse.json({ url: `/api/img/${id}` });
}

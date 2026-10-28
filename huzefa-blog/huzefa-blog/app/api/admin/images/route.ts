import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Newest uploaded images (no image data), for the editor's "My uploaded images" tab. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, name: true, size: true },
    });
    return NextResponse.json({ images });
  } catch (e) {
    console.error("Image list failed:", e);
    return NextResponse.json({ error: "Could not load your images." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** CSV of every subscriber (admin only). */
export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Not authorised", { status: 401 });
  const all = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" }, select: { email: true, source: true, createdAt: true } });
  // Emails are validated on sign-up, but guard against spreadsheet formulas anyway.
  const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""');
  const lines = ["email,source,joined", ...all.map((s) => `"${safe(s.email)}","${safe(s.source)}","${s.createdAt.toISOString()}"`)];
  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="subscribers.csv"',
      "cache-control": "no-store",
    },
  });
}

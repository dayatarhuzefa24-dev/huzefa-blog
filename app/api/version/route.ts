import { NextResponse } from "next/server";
import { APP_VERSION, APP_VERSION_NOTE } from "@/lib/version";

export const dynamic = "force-dynamic";

/** Open /api/version on your site: if it shows version 3.0, the new code is live. */
export function GET() {
  return NextResponse.json({ site: "Huzefa Dayatar", version: APP_VERSION, includes: APP_VERSION_NOTE });
}

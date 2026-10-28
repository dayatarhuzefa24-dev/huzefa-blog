"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SubscribeState = { error?: string; ok?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Public: newsletter sign-up form (footer and under every story). */
export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // Hidden "company" box: only bots fill it.
  if (String(formData.get("company") ?? "").trim()) return { ok: "You're subscribed. Thank you!" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const source = String(formData.get("source") ?? "site").slice(0, 30).replace(/[^\w-]/g, "") || "site";
  if (!email || email.length > 120 || !EMAIL.test(email)) return { error: "Please enter a valid email address." };

  const jar = await cookies();
  const last = Number(jar.get("s_last")?.value ?? 0);
  if (Date.now() - last < 10_000) return { error: "Please wait a few seconds and try again." };

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { ok: "You're already subscribed. Thank you!" };
    await prisma.subscriber.create({ data: { email, source } });
  } catch (e) {
    console.error("Subscribe failed:", e);
    return { error: "Sign-ups are not available right now. Please try again later." };
  }

  jar.set("s_last", String(Date.now()), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return { ok: "You're subscribed. Thank you!" };
}

/** Admin: remove a subscriber. */
export async function deleteSubscriber(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  if (id) {
    try {
      await prisma.subscriber.delete({ where: { id } });
    } catch {
      // already gone
    }
  }
  revalidatePath("/admin/subscribers");
}

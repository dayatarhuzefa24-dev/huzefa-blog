import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

/** Session token = HMAC(AUTH_SECRET, ADMIN_PASSWORD). Changing either logs everyone out. */
function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret) return null;
  return createHmac("sha256", secret).update(`admin:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return safeEqual(input, password);
}

export async function isAdmin(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value;
  if (!value) return false;
  return safeEqual(value, expected);
}

export async function setSession(): Promise<void> {
  const token = expectedToken();
  if (!token) throw new Error("ADMIN_PASSWORD and AUTH_SECRET must be set.");
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

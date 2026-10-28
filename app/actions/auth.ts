"use server";

import { redirect } from "next/navigation";
import { checkPassword, clearSession, isAuthConfigured, setSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return { error: "Server is missing ADMIN_PASSWORD or AUTH_SECRET." };
  }
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Wrong password." };
  }
  await setSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/admin");
}

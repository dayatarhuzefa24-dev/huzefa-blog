"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mx-auto mt-16 max-w-sm space-y-4 rounded-xl border border-zinc-200 p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Admin login</h1>
      <input
        type="password"
        name="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
      />
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

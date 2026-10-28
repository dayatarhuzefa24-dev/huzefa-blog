"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribers";

/** Newsletter sign-up. `tone="dark"` is for the black footer, `tone="light"` for white areas. */
export default function SubscribeForm({ source, tone = "light" }: { source: string; tone?: "dark" | "light" }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, {});
  const dark = tone === "dark";

  if (state.ok) {
    return (
      <p role="status" className={`text-base font-semibold ${dark ? "text-white" : "text-text"}`}>
        <span className="hl hl-on">{state.ok}</span>
      </p>
    );
  }

  return (
    <form action={action} className="w-full max-w-md">
      <input type="hidden" name="source" value={source} />
      {/* Bots fill this hidden box; people never see it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label htmlFor={`sub-${source}`} className="sr-only">Your email address</label>
      <div className="flex">
        <input
          id={`sub-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={`min-w-0 flex-1 rounded-none border-2 px-3 py-2.5 text-base outline-none placeholder:opacity-60 ${
            dark ? "border-white/30 bg-transparent text-white focus:border-taxi" : "border-text bg-surface text-text focus:border-taxi"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className="border-2 border-taxi bg-taxi px-5 py-2.5 text-base font-bold text-ink hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className={`mt-2 text-sm ${dark ? "text-red-300" : "text-signal"}`}>{state.error}</p>
      )}
    </form>
  );
}

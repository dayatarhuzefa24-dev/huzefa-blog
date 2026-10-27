"use client";

import { useActionState } from "react";
import { slugify } from "@/lib/slug";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryState,
} from "@/app/actions/categories";

export type CategoryRowData = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  posts: number;
};

const input = "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900";

function Message({ state }: { state: CategoryState }) {
  if (state.error) return <p className="text-sm text-red-600" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-green-700" role="status">{state.ok}</p>;
  return null;
}

function AddCategory() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(createCategory, {});
  return (
    <form action={action} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-700">Add a category</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_90px]">
        <input name="name" required placeholder="Name, e.g. Cricket" aria-label="Category name" className={input} />
        <input name="description" placeholder="Short description (optional)" aria-label="Description" className={input} />
        <input name="sortOrder" type="number" min={0} placeholder="Order" aria-label="Order" className={input} />
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Adding…" : "Add category"}
        </button>
        <Message state={state} />
      </div>
    </form>
  );
}

function Row({ c }: { c: CategoryRowData }) {
  const [saved, save, saving] = useActionState<CategoryState, FormData>(updateCategory, {});
  const [removed, remove, removing] = useActionState<CategoryState, FormData>(deleteCategory, {});

  return (
    <li className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
      <form action={save} className="grid gap-3 sm:grid-cols-[1fr_2fr_90px_auto]">
        <input type="hidden" name="id" value={c.id} />
        <input name="name" required defaultValue={c.name} aria-label="Category name" className={input} />
        <input name="description" defaultValue={c.description} placeholder="Short description (optional)" aria-label="Description" className={input} />
        <input name="sortOrder" type="number" min={0} defaultValue={c.sortOrder} aria-label="Order" className={input} />
        <button type="submit" disabled={saving} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:border-zinc-900 disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {c.posts} post{c.posts === 1 ? "" : "s"} · address /category/{slugify(c.name)}
        </p>
        <form
          action={remove}
          onSubmit={(e) => {
            if (!window.confirm(`Delete the category “${c.name}”?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" disabled={removing} className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60">
            Delete
          </button>
        </form>
      </div>
      <Message state={saved} />
      <Message state={removed} />
    </li>
  );
}

export default function CategoryManager({ rows }: { rows: CategoryRowData[] }) {
  return (
    <div className="space-y-6">
      <AddCategory />
      <ul className="space-y-3">
        {rows.map((c) => (
          <Row key={c.id} c={c} />
        ))}
      </ul>
      {rows.length === 0 && <p className="text-zinc-500">No categories yet. Add your first one above.</p>}
      <p className="text-xs text-zinc-500">
        Renaming a category moves all its posts to the new name and changes its web address. The order number decides the
        position in the menu (smaller comes first).
      </p>
    </div>
  );
}

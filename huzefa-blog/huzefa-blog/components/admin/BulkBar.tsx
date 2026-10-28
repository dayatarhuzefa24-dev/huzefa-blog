"use client";

import { bulkPosts } from "@/app/actions/posts";

/**
 * Bulk actions for the posts table. The row checkboxes live in the table and point at this
 * form with form="bulk-form", so the table's own Unpublish/Delete forms are not nested inside it.
 */
export default function BulkBar({ categories }: { categories: string[] }) {
  function toggleAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>('input[name="ids"][form="bulk-form"]').forEach((el) => {
      el.checked = checked;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const picked = document.querySelectorAll('input[name="ids"][form="bulk-form"]:checked').length;
    const action = (form.elements.namedItem("bulk") as HTMLSelectElement).value;
    if (!action || picked === 0) {
      e.preventDefault();
      window.alert(picked === 0 ? "Tick at least one post first." : "Choose what to do with the ticked posts.");
      return;
    }
    if (action === "delete" && !window.confirm(`Delete ${picked} post${picked === 1 ? "" : "s"} for good? This cannot be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <form id="bulk-form" action={bulkPosts} onSubmit={onSubmit} className="mb-3 flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} className="h-4 w-4" />
        Select all
      </label>
      <select name="bulk" defaultValue="" aria-label="Action for ticked posts" className="border border-line bg-surface px-2 py-1.5">
        <option value="">With ticked posts…</option>
        <option value="draft">Move to drafts</option>
        {categories.map((c) => (
          <option key={c} value={`cat:${c}`}>Move to {c}</option>
        ))}
        <option value="delete">Delete</option>
      </select>
      <button type="submit" className="border-2 border-ink bg-taxi px-3 py-1.5 font-bold text-ink hover:brightness-95">Apply</button>
    </form>
  );
}

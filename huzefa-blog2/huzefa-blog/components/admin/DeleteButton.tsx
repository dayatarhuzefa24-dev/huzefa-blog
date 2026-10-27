"use client";

import { deletePost } from "@/app/actions/posts";

/** Asks "are you sure?" before deleting a post. */
export default function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form action={deletePost}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(`Delete “${title}” permanently? This cannot be undone.`)) e.preventDefault();
        }}
        className="text-sm font-medium text-red-600 hover:underline"
      >
        Delete
      </button>
    </form>
  );
}

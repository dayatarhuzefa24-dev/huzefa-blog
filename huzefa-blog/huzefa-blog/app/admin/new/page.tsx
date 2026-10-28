import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  if (!(await isAdmin())) redirect("/admin");
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">New post</h1>
      <PostForm categories={categories.map((c) => c.name)} />
    </div>
  );
}

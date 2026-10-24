import { logout } from "@/app/actions/auth";
import { isAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";
import PostForm from "./PostForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="px-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New post</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-600 underline">Log out</button>
        </form>
      </header>
      <PostForm />
    </div>
  );
}

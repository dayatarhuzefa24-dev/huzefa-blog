import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteSubscriber } from "@/app/actions/subscribers";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  if (!(await isAdmin())) redirect("/admin");

  let problem = "";
  let total = 0;
  let rows: { id: string; email: string; source: string; createdAt: Date }[] = [];
  try {
    [total, rows] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500, select: { id: true, email: true, source: true, createdAt: true } }),
    ]);
  } catch (e) {
    console.error("Subscribers page failed:", e);
    problem = "The subscribers table is missing. Run prisma/upgrade-v3.sql in Neon's SQL Editor, then reload this page.";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Subscribers</h1>
          <p className="mt-1 text-sm text-muted">{total} {total === 1 ? "person has" : "people have"} signed up for new-story emails.</p>
        </div>
        {total > 0 && (
          <Link href="/admin/subscribers/export" prefetch={false} className="border-2 border-ink bg-taxi px-4 py-2 text-sm font-bold text-ink hover:brightness-95">
            Download list (CSV)
          </Link>
        )}
      </div>

      {problem && <p className="mb-4 border-l-4 border-signal bg-surface p-3 text-sm text-signal" role="alert">{problem}</p>}

      <p className="mb-4 border-l-4 border-taxi bg-surface p-3 text-sm">
        This site collects the addresses. To email them, download the CSV and import it into a mailing tool such as Brevo, MailerLite or Substack.
      </p>

      {rows.length === 0 && !problem ? (
        <p className="border border-line bg-surface p-8 text-center text-muted">No subscribers yet. The sign-up forms are in the footer, the homepage sidebar and under every story.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line bg-soft text-xs text-muted">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Where from</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5 font-medium">{s.email}</td>
                  <td className="px-4 py-2.5 text-muted">{s.source}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ConfirmButton action={deleteSubscriber} id={s.id} label="Remove" message={`Remove ${s.email} from the list?`} className="text-sm font-semibold text-signal hover:underline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > rows.length && <p className="mt-3 text-xs text-muted">Showing the newest {rows.length}. The CSV download has everyone.</p>}
    </div>
  );
}

// The admin edits publish times in Indian Standard Time (UTC+05:30, no daylight saving),
// so the same value is produced on the server and in the browser, whatever the visitor's timezone.

/** ISO string -> "2026-10-24T21:30" (value for <input type="datetime-local">) in IST. */
export function toIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "2026-10-24T21:30" (IST) -> ISO string, or "" if empty/invalid. */
export function fromIstInput(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return "";
  const d = new Date(`${local}:00+05:30`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

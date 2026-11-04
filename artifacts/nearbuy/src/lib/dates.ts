// Database timestamps sometimes come back WITHOUT a timezone, e.g. "2026-11-03T23:09:00".
// That time is UTC, but the browser would read it as local time. In Nigeria (UTC+1) that
// made a brand-new order look one hour old. This reads such strings as UTC.
// Strings that already carry "Z" or an offset (+00:00) are left exactly as they are.
export function parseDbDate(v: string | number | Date | null | undefined): Date {
  if (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v) &&
    !/(Z|[+-]\d{2}(:?\d{2})?)$/i.test(v)
  ) {
    return new Date(v.replace(" ", "T") + "Z");
  }
  return new Date(v as any);
}

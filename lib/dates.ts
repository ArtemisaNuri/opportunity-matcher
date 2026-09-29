/**
 * Date helpers. Every date in the domain is an ISO calendar date ("YYYY-MM-DD")
 * and every month is a key ("YYYY-MM"). All math is done in UTC so results are
 * deterministic regardless of the viewer's timezone.
 */

export type ISODate = string; // YYYY-MM-DD
export type MonthKey = string; // YYYY-MM

const DAY_MS = 86_400_000;

export function parseISO(date: ISODate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

export function toISO(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function addDays(date: ISODate, days: number): ISODate {
  return toISO(parseISO(date) + days * DAY_MS);
}

export function addWeeks(date: ISODate, weeks: number): ISODate {
  return addDays(date, Math.round(weeks * 7));
}

export function addMonths(date: ISODate, months: number): ISODate {
  const d = new Date(parseISO(date));
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1);
  const t = new Date(target);
  const lastDay = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return toISO(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d.getUTCDate(), lastDay)));
}

/** Whole days from a to b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b) - parseISO(a)) / DAY_MS);
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return parseISO(a) >= parseISO(b) ? a : b;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return parseISO(a) <= parseISO(b) ? a : b;
}

export function monthKey(date: ISODate): MonthKey {
  return date.slice(0, 7);
}

export function monthStart(key: MonthKey): ISODate {
  return `${key}-01`;
}

/** Exclusive end: the first day of the following month. */
export function monthEndExclusive(key: MonthKey): ISODate {
  return addMonths(monthStart(key), 1);
}

export function daysInMonth(key: MonthKey): number {
  return diffDays(monthStart(key), monthEndExclusive(key));
}

/** `count` consecutive month keys starting with the month containing `from`. */
export function monthRange(from: ISODate, count: number): MonthKey[] {
  const out: MonthKey[] = [];
  let cursor = monthStart(monthKey(from));
  for (let i = 0; i < count; i++) {
    out.push(monthKey(cursor));
    cursor = addMonths(cursor, 1);
  }
  return out;
}

/** Month keys touched by the half-open window [start, endExclusive). */
export function monthsBetween(start: ISODate, endExclusive: ISODate): MonthKey[] {
  if (parseISO(endExclusive) <= parseISO(start)) return [];
  const out: MonthKey[] = [];
  let cursor = monthStart(monthKey(start));
  while (parseISO(cursor) < parseISO(endExclusive)) {
    out.push(monthKey(cursor));
    cursor = addMonths(cursor, 1);
  }
  return out;
}

/** Days of overlap between [aStart, aEndEx) and [bStart, bEndEx). */
export function overlapDays(
  aStart: ISODate,
  aEndExclusive: ISODate,
  bStart: ISODate,
  bEndExclusive: ISODate,
): number {
  const start = Math.max(parseISO(aStart), parseISO(bStart));
  const end = Math.min(parseISO(aEndExclusive), parseISO(bEndExclusive));
  return end > start ? Math.round((end - start) / DAY_MS) : 0;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonth(key: MonthKey, style: "short" | "long" | "shortYear" = "short"): string {
  const [y, m] = key.split("-").map(Number);
  if (style === "long") return `${MONTHS_LONG[m - 1]} ${y}`;
  if (style === "shortYear") return `${MONTHS_SHORT[m - 1]} ’${String(y).slice(2)}`;
  return MONTHS_SHORT[m - 1];
}

export function formatDate(date: ISODate, withYear = true): string {
  const [y, m, d] = date.split("-").map(Number);
  return withYear ? `${MONTHS_SHORT[m - 1]} ${d}, ${y}` : `${MONTHS_SHORT[m - 1]} ${d}`;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISO(parseISO(value)) === value;
}

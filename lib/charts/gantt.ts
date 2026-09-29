/**
 * Gantt geometry: positions (percent of the month window) at day precision. Pure.
 */
import { diffDays, monthEndExclusive, monthStart, type ISODate, type MonthKey } from "@/lib/dates";

export interface GanttWindow {
  start: ISODate;
  /** Exclusive. */
  end: ISODate;
  days: number;
}

export function ganttWindow(months: MonthKey[]): GanttWindow {
  const start = monthStart(months[0]);
  const end = monthEndExclusive(months[months.length - 1]);
  return { start, end, days: Math.max(1, diffDays(start, end)) };
}

/** Percent position of a date within the window; null when outside [start, end]. */
export function datePosition(w: GanttWindow, date: ISODate): number | null {
  const d = diffDays(w.start, date);
  if (d < 0 || d > w.days) return null;
  return (d / w.days) * 100;
}

export interface GanttSpan {
  left: number;
  width: number;
  /** The real start/end fall outside the window. */
  clippedStart: boolean;
  clippedEnd: boolean;
}

/** Bar geometry for [start, end) clipped to the window; null when it does not overlap. */
export function ganttSpan(w: GanttWindow, start: ISODate, end: ISODate): GanttSpan | null {
  const s = diffDays(w.start, start);
  const e = diffDays(w.start, end);
  if (e <= 0 || s >= w.days || e <= s) return null;
  const cs = Math.max(0, s);
  const ce = Math.min(w.days, e);
  return {
    left: (cs / w.days) * 100,
    width: ((ce - cs) / w.days) * 100,
    clippedStart: s < 0,
    clippedEnd: e > w.days,
  };
}

/** Month columns: left edge and width in percent (months have different lengths). */
export function monthColumns(w: GanttWindow, months: MonthKey[]): { month: MonthKey; left: number; width: number }[] {
  return months.map((m) => {
    const left = (diffDays(w.start, monthStart(m)) / w.days) * 100;
    const width = (diffDays(monthStart(m), monthEndExclusive(m)) / w.days) * 100;
    return { month: m, left, width };
  });
}

/**
 * Workload math. Pure functions, no framework code.
 *
 * Hours in a month = weekly hours × (days of the month covered / 7).
 * Assignments and opportunity windows are half-open [start, end).
 */
import {
  addWeeks,
  daysInMonth,
  monthEndExclusive,
  monthStart,
  monthsBetween,
  overlapDays,
  type ISODate,
  type MonthKey,
} from "@/lib/dates";
import type { Opportunity, Project, TeamMember } from "@/lib/domain/types";

export type UtilizationState = "low" | "healthy" | "busy" | "near" | "overloaded";

export const UTILIZATION_LABEL: Record<UtilizationState, string> = {
  low: "Low",
  healthy: "Healthy",
  busy: "Busy",
  near: "Near capacity",
  overloaded: "Overloaded",
};

export const UTILIZATION_RANGE: Record<UtilizationState, string> = {
  low: "0–50%",
  healthy: "51–75%",
  busy: "76–90%",
  near: "91–100%",
  overloaded: ">100%",
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Hours contributed in `month` by `hoursPerWeek` over [start, endExclusive). */
export function hoursInMonth(hoursPerWeek: number, start: ISODate, endExclusive: ISODate, month: MonthKey): number {
  const days = overlapDays(start, endExclusive, monthStart(month), monthEndExclusive(month));
  return (hoursPerWeek * days) / 7;
}

/** Full-month hours for a weekly amount. */
export function monthHours(hoursPerWeek: number, month: MonthKey): number {
  return (hoursPerWeek * daysInMonth(month)) / 7;
}

export function teamCapacityByMonth(members: TeamMember[], months: MonthKey[]): Record<MonthKey, number> {
  const weekly = members.reduce((sum, m) => sum + m.weeklyHours, 0);
  return Object.fromEntries(months.map((m) => [m, round1(monthHours(weekly, m))]));
}

/** Hours demanded by each project per month: { [projectId]: { [month]: hours } }. */
export function demandByMonth(projects: Project[], months: MonthKey[]): Record<string, Record<MonthKey, number>> {
  const out: Record<string, Record<MonthKey, number>> = {};
  for (const p of projects) {
    out[p.id] = {};
    for (const month of months) {
      const hours = p.assignments.reduce((s, a) => s + hoursInMonth(a.hoursPerWeek, a.start, a.end, month), 0);
      out[p.id][month] = round1(hours);
    }
  }
  return out;
}

export function totalDemandByMonth(projects: Project[], months: MonthKey[]): Record<MonthKey, number> {
  const byProject = demandByMonth(projects, months);
  return Object.fromEntries(
    months.map((m) => [m, round1(Object.values(byProject).reduce((s, row) => s + (row[m] ?? 0), 0))]),
  );
}

export function opportunityWindow(opp: Pick<Opportunity, "requirements">, startShiftWeeks = 0) {
  const start = addWeeks(opp.requirements.preferredStart, startShiftWeeks);
  const end = addWeeks(start, Math.max(1, opp.requirements.durationWeeks));
  return { start, end };
}

export function opportunityMonths(opp: Pick<Opportunity, "requirements">, startShiftWeeks = 0): MonthKey[] {
  const { start, end } = opportunityWindow(opp, startShiftWeeks);
  return monthsBetween(start, end);
}

export function opportunityDemandByMonth(
  opp: Pick<Opportunity, "requirements">,
  months: MonthKey[],
  startShiftWeeks = 0,
): Record<MonthKey, number> {
  const { start, end } = opportunityWindow(opp, startShiftWeeks);
  return Object.fromEntries(
    months.map((m) => [m, round1(hoursInMonth(opp.requirements.hoursPerWeek, start, end, m))]),
  );
}

export interface MemberMonthLoad {
  month: MonthKey;
  booked: number;
  capacity: number;
  /** booked / capacity as a percentage; 0 when capacity is 0 and nothing is booked. */
  utilization: number;
  state: UtilizationState;
}

export function memberLoadByMonth(member: TeamMember, projects: Project[], months: MonthKey[]): MemberMonthLoad[] {
  return months.map((month) => {
    let booked = 0;
    for (const p of projects) {
      for (const a of p.assignments) {
        if (a.memberId === member.id) booked += hoursInMonth(a.hoursPerWeek, a.start, a.end, month);
      }
    }
    const capacity = monthHours(member.weeklyHours, month);
    const utilization = safePercent(booked, capacity);
    return {
      month,
      booked: round1(booked),
      capacity: round1(capacity),
      utilization,
      state: utilizationState(utilization),
    };
  });
}

/** Weekly hours currently booked for a member on a given date. */
export function memberHoursOnDate(member: TeamMember, projects: Project[], date: ISODate): number {
  let hours = 0;
  for (const p of projects) {
    for (const a of p.assignments) {
      if (a.memberId === member.id && a.start <= date && date < a.end) hours += a.hoursPerWeek;
    }
  }
  return hours;
}

export function safePercent(part: number, whole: number): number {
  if (whole <= 0) return part > 0 ? 999 : 0;
  return Math.round((part / whole) * 100);
}

export function utilizationState(percent: number): UtilizationState {
  if (percent <= 50) return "low";
  if (percent <= 75) return "healthy";
  if (percent <= 90) return "busy";
  if (percent <= 100) return "near";
  return "overloaded";
}

/**
 * Chart data shaping for the workload views (area chart + Gantt). Pure functions.
 *
 * The overload math deliberately mirrors `evaluateCapacity` in lib/scoring/engine.ts:
 * existing demand (round1 per project, summed and rounded like `totalDemandByMonth`)
 * + opportunity demand (`opportunityDemandByMonth`) > capacity + 0.05.
 */
import {
  formatMonth,
  monthKey,
  monthRange,
  monthStart,
  monthsBetween,
  type ISODate,
  type MonthKey,
} from "@/lib/dates";
import {
  demandByMonth,
  opportunityDemandByMonth,
  opportunityWindow,
  safePercent,
  teamCapacityByMonth,
} from "@/lib/capacity";
import { projectColor } from "@/lib/palette";
import type { Milestone, Opportunity, Project, TeamMember } from "@/lib/domain/types";

export type ComparisonSet = "existing" | "top" | "queued" | "backup";

export const COMPARISON_SETS: ComparisonSet[] = ["existing", "top", "queued", "backup"];

export const COMPARISON_SET_LABEL: Record<ComparisonSet, string> = {
  existing: "Existing projects",
  top: "Top matches",
  queued: "Queued matches",
  backup: "Backup matches",
};

/** Tolerance used by the scoring engine when comparing demand with capacity. */
export const OVERLOAD_EPSILON = 0.05;

const round1 = (n: number) => Math.round(n * 10) / 10;

// ------------------------------------------------------------------ window

/**
 * Months shown by the workload charts: from the current month, long enough to
 * cover `coverUntil` (exclusive), clamped to [min, max] months.
 */
export function chartWindow(
  today: ISODate,
  coverUntil?: ISODate,
  { min = 9, max = 12 }: { min?: number; max?: number } = {},
): MonthKey[] {
  const needed = coverUntil ? monthsBetween(monthStart(monthKey(today)), coverUntil).length : min;
  const count = Math.max(min, Math.min(max, needed));
  return monthRange(today, count);
}

/**
 * Months for a comparison chart: from the earlier of this month and the opportunity's start, through the
 * opportunity's end (at least `min` months). Always contains every delivery month, so the chart's red months
 * can match the engine's conflicts even for past or long-running opportunities.
 */
export function comparisonWindow(today: ISODate, start: ISODate, endExclusive: ISODate, min = 9): MonthKey[] {
  const from = monthKey(start) < monthKey(today) ? monthStart(monthKey(start)) : monthStart(monthKey(today));
  const needed = monthsBetween(from, endExclusive).length;
  return monthRange(from, Math.max(min, needed));
}

// ------------------------------------------------------------------ series

export interface WorkloadSeries {
  /** Entity id (project or opportunity). */
  id: string;
  /** Recharts-safe data key for this series. */
  key: string;
  kind: "project" | "opportunity";
  name: string;
  client: string;
  color: string;
  start: ISODate;
  /** Exclusive end (a project's launch, or the end of an opportunity's delivery window). */
  end: ISODate;
  /** Launch date (projects only). */
  launch?: ISODate;
  milestones: Milestone[];
  /** Projects: peak concurrent hours/week. Opportunities: required hours/week. */
  hoursPerWeek: number;
  teamSize: number;
  /** Hours demanded per month over the chart window. */
  demand: Record<MonthKey, number>;
}

/** Peak concurrent weekly hours across a project's assignments. */
export function projectPeakHoursPerWeek(project: Project): number {
  let peak = 0;
  for (const probe of project.assignments) {
    const at = probe.start;
    const sum = project.assignments.reduce((s, a) => s + (a.start <= at && at < a.end ? a.hoursPerWeek : 0), 0);
    peak = Math.max(peak, sum);
  }
  return peak;
}

export function projectTeamSize(project: Project): number {
  return new Set(project.assignments.map((a) => a.memberId)).size;
}

/** Existing projects as series, ordered by their fixed color slot. */
export function projectSeries(projects: Project[], months: MonthKey[]): WorkloadSeries[] {
  const demand = demandByMonth(projects, months);
  return [...projects]
    .sort((a, b) => a.colorSlot - b.colorSlot || a.id.localeCompare(b.id))
    .map((p) => ({
      id: p.id,
      key: `s_${p.id.replace(/[^a-zA-Z0-9]/g, "_")}`,
      kind: "project" as const,
      name: p.name,
      client: p.client,
      color: projectColor(p.colorSlot),
      start: p.start,
      end: p.launch,
      launch: p.launch,
      milestones: p.milestones,
      hoursPerWeek: projectPeakHoursPerWeek(p),
      teamSize: projectTeamSize(p),
      demand: demand[p.id] ?? {},
    }));
}

/**
 * Other scored opportunities in `category`, treated as hypothetical projects.
 * Colors come from the series' position when sorted by id, so they never depend on
 * score rank. The palette has no violet, which stays reserved for the evaluated opportunity.
 */
export function opportunitySeries(
  opportunities: Opportunity[],
  category: Exclude<ComparisonSet, "existing">,
  months: MonthKey[],
  excludeId?: string,
): WorkloadSeries[] {
  return opportunities
    .filter((o) => o.id !== excludeId && o.scoring.result?.category === category)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((o, i) => {
      const { start, end } = opportunityWindow(o);
      return {
        id: o.id,
        key: `s_${o.id.replace(/[^a-zA-Z0-9]/g, "_")}`,
        kind: "opportunity" as const,
        name: o.title,
        client: o.client,
        color: projectColor(i),
        start,
        end,
        milestones: o.milestones,
        hoursPerWeek: o.requirements.hoursPerWeek,
        teamSize: o.requirements.teamSize,
        demand: opportunityDemandByMonth(o, months),
      };
    });
}

export function comparisonSeries(
  set: ComparisonSet,
  source: { projects: Project[]; opportunities: Opportunity[] },
  months: MonthKey[],
  excludeId?: string,
): WorkloadSeries[] {
  return set === "existing"
    ? projectSeries(source.projects, months)
    : opportunitySeries(source.opportunities, set, months, excludeId);
}

/** Series that contribute at least one hour inside the window (the others would be invisible). */
export function visibleSeries(series: WorkloadSeries[], months: MonthKey[]): WorkloadSeries[] {
  return series.filter((s) => months.some((m) => (s.demand[m] ?? 0) > 0));
}

// ------------------------------------------------------------------ area rows

export interface WorkloadRow {
  /** Position on the numeric x axis. */
  index: number;
  month: MonthKey;
  label: string;
  capacity: number;
  /** Hours of the compared set (rounded like `totalDemandByMonth`). */
  setTotal: number;
  /** Opportunity hours this month (0 when not included). */
  opportunity: number;
  /** setTotal + opportunity, rounded to 0.1 h. */
  total: number;
  utilization: number;
  overloaded: boolean;
  /** Hours above capacity (> 0 only when overloaded). */
  overBy: number;
  /** Per-series hours keyed by `WorkloadSeries.key`, flattened for Recharts. */
  [seriesKey: string]: number | string | boolean;
}

export function buildWorkloadRows({
  months,
  series,
  capacity,
  opportunityDemand,
}: {
  months: MonthKey[];
  series: WorkloadSeries[];
  capacity: Record<MonthKey, number>;
  /** Pass to stack the evaluated opportunity on top; omit for the current workload. */
  opportunityDemand?: Record<MonthKey, number>;
}): WorkloadRow[] {
  return months.map((month, index) => {
    const setTotal = round1(series.reduce((s, x) => s + (x.demand[month] ?? 0), 0));
    const opportunity = opportunityDemand?.[month] ?? 0;
    const cap = capacity[month] ?? 0;
    const raw = setTotal + opportunity;
    const overloaded = raw > cap + OVERLOAD_EPSILON;
    const row: WorkloadRow = {
      index,
      month,
      label: formatMonth(month),
      capacity: cap,
      setTotal,
      opportunity,
      total: round1(raw),
      utilization: safePercent(raw, cap),
      overloaded,
      overBy: overloaded ? round1(raw - cap) : 0,
    };
    for (const s of series) row[s.key] = s.demand[month] ?? 0;
    return row;
  });
}

export interface OverloadedMonth {
  month: MonthKey;
  index: number;
  overBy: number;
}

export function overloadedMonths(rows: WorkloadRow[]): OverloadedMonth[] {
  return rows.filter((r) => r.overloaded).map((r) => ({ month: r.month, index: r.index, overBy: r.overBy }));
}

// ------------------------------------------------------------------ one-call model

export interface ComparisonModel {
  months: MonthKey[];
  series: WorkloadSeries[];
  opportunity: Pick<WorkloadSeries, "start" | "end" | "hoursPerWeek" | "teamSize" | "milestones"> & {
    demand: Record<MonthKey, number>;
  };
  /** Rows with the opportunity stacked on top. */
  withOpportunity: WorkloadRow[];
  /** Rows for the compared set alone. */
  current: WorkloadRow[];
  overloadWith: OverloadedMonth[];
  overloadCurrent: OverloadedMonth[];
}

/** Everything the Project Comparison card needs for one set. */
export function buildComparisonModel({
  opportunity,
  set,
  members,
  projects,
  opportunities,
  today,
}: {
  opportunity: Opportunity;
  set: ComparisonSet;
  members: TeamMember[];
  projects: Project[];
  opportunities: Opportunity[];
  today: ISODate;
}): ComparisonModel {
  const window = opportunityWindow(opportunity);
  const months = comparisonWindow(today, window.start, window.end);
  const capacity = teamCapacityByMonth(members, months);
  const series = visibleSeries(comparisonSeries(set, { projects, opportunities }, months, opportunity.id), months);
  const demand = opportunityDemandByMonth(opportunity, months);
  const withOpportunity = buildWorkloadRows({ months, series, capacity, opportunityDemand: demand });
  const current = buildWorkloadRows({ months, series, capacity });
  return {
    months,
    series,
    opportunity: {
      start: window.start,
      end: window.end,
      hoursPerWeek: opportunity.requirements.hoursPerWeek,
      teamSize: opportunity.requirements.teamSize,
      milestones: opportunity.milestones,
      demand,
    },
    withOpportunity,
    current,
    overloadWith: overloadedMonths(withOpportunity),
    overloadCurrent: overloadedMonths(current),
  };
}

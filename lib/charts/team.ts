/**
 * Team capacity table, project grouping, heatmap and KPI shaping. Pure.
 */
import {
  memberHoursOnDate,
  memberLoadByMonth,
  safePercent,
  teamCapacityByMonth,
  totalDemandByMonth,
  utilizationState,
  type MemberMonthLoad,
  type UtilizationState,
} from "@/lib/capacity";
import { monthRange, type ISODate, type MonthKey } from "@/lib/dates";
import type { Project, TeamMember } from "@/lib/domain/types";

const round1 = (n: number) => Math.round(n * 10) / 10;

// ------------------------------------------------------------------ by member

export interface MemberCapacityRow {
  member: TeamMember;
  contracted: number;
  /** Weekly hours booked at `asOf`. */
  current: number;
  /** contracted − current (negative when overbooked). */
  open: number;
  utilization: number;
  state: UtilizationState;
}

export function memberCapacityRow(member: TeamMember, projects: Project[], asOf: ISODate): MemberCapacityRow {
  const current = memberHoursOnDate(member, projects, asOf);
  const utilization = safePercent(current, member.weeklyHours);
  return {
    member,
    contracted: member.weeklyHours,
    current,
    open: member.weeklyHours - current,
    utilization,
    state: utilizationState(utilization),
  };
}

/** Rows sorted by open hours (most available first), then by name. */
export function memberCapacityRows(members: TeamMember[], projects: Project[], asOf: ISODate): MemberCapacityRow[] {
  return members
    .map((m) => memberCapacityRow(m, projects, asOf))
    .sort((a, b) => b.open - a.open || a.member.name.localeCompare(b.member.name));
}

export interface CapacityTotals {
  contracted: number;
  current: number;
  /** Sum of max(0, open) — hours that can actually be booked. */
  open: number;
  /** Sum of overbooked hours (positive number). */
  overbooked: number;
  utilization: number;
  state: UtilizationState;
}

export function capacityTotals(rows: MemberCapacityRow[]): CapacityTotals {
  const contracted = rows.reduce((s, r) => s + r.contracted, 0);
  const current = rows.reduce((s, r) => s + r.current, 0);
  const open = rows.reduce((s, r) => s + Math.max(0, r.open), 0);
  const overbooked = rows.reduce((s, r) => s + Math.max(0, -r.open), 0);
  const utilization = safePercent(current, contracted);
  return { contracted, current, open, overbooked, utilization, state: utilizationState(utilization) };
}

// ------------------------------------------------------------------ by project

export interface ProjectMemberRow {
  member: TeamMember;
  /** Weekly hours on this project (at `asOf` for active projects, planned peak for later ones). */
  hours: number;
  /** For later projects: when this member starts. */
  from?: ISODate;
}

export interface ProjectGroup {
  project: Project;
  totalHours: number;
  members: ProjectMemberRow[];
}

export interface ProjectGrouping {
  /** Projects with at least one assignment active at `asOf`. */
  active: ProjectGroup[];
  /** Projects with no active assignment at `asOf` but assignments that start later. */
  later: ProjectGroup[];
  /** Members with no booked hours at `asOf`. */
  unassigned: MemberCapacityRow[];
}

export function projectGroups(members: TeamMember[], projects: Project[], asOf: ISODate): ProjectGrouping {
  const byId = new Map(members.map((m) => [m.id, m]));
  const active: ProjectGroup[] = [];
  const later: ProjectGroup[] = [];
  const ordered = [...projects].sort((a, b) => a.start.localeCompare(b.start) || a.colorSlot - b.colorSlot);

  for (const project of ordered) {
    const now = new Map<string, number>();
    for (const a of project.assignments) {
      if (a.start <= asOf && asOf < a.end) now.set(a.memberId, (now.get(a.memberId) ?? 0) + a.hoursPerWeek);
    }
    if (now.size > 0) {
      const rows = [...now]
        .filter(([id]) => byId.has(id))
        .map(([id, hours]) => ({ member: byId.get(id)!, hours }))
        .sort((a, b) => b.hours - a.hours || a.member.name.localeCompare(b.member.name));
      active.push({ project, totalHours: rows.reduce((s, r) => s + r.hours, 0), members: rows });
      continue;
    }
    const future = project.assignments.filter((a) => a.start > asOf);
    if (future.length === 0) continue;
    const planned = new Map<string, { hours: number; from: ISODate }>();
    for (const a of future) {
      const prev = planned.get(a.memberId);
      planned.set(a.memberId, {
        hours: Math.max(prev?.hours ?? 0, a.hoursPerWeek),
        from: prev && prev.from < a.start ? prev.from : a.start,
      });
    }
    const rows = [...planned]
      .filter(([id]) => byId.has(id))
      .map(([id, v]) => ({ member: byId.get(id)!, hours: v.hours, from: v.from }))
      .sort((a, b) => b.hours - a.hours || a.member.name.localeCompare(b.member.name));
    later.push({ project, totalHours: rows.reduce((s, r) => s + r.hours, 0), members: rows });
  }

  const unassigned = members
    .map((m) => memberCapacityRow(m, projects, asOf))
    .filter((r) => r.current === 0)
    .sort((a, b) => a.member.name.localeCompare(b.member.name));

  return { active, later, unassigned };
}

// ------------------------------------------------------------------ heatmap

export interface HeatmapRow {
  member: TeamMember;
  loads: MemberMonthLoad[];
}

export function heatmapRows(members: TeamMember[], projects: Project[], months: MonthKey[]): HeatmapRow[] {
  return members.map((member) => ({ member, loads: memberLoadByMonth(member, projects, months) }));
}

/** Team total per month: sum of booked hours over sum of capacity. */
export function heatmapTotals(rows: HeatmapRow[], months: MonthKey[]): MemberMonthLoad[] {
  return months.map((month, i) => {
    const booked = rows.reduce((s, r) => s + (r.loads[i]?.booked ?? 0), 0);
    const capacity = rows.reduce((s, r) => s + (r.loads[i]?.capacity ?? 0), 0);
    const utilization = safePercent(booked, capacity);
    return { month, booked: round1(booked), capacity: round1(capacity), utilization, state: utilizationState(utilization) };
  });
}

// ------------------------------------------------------------------ KPIs

export interface TeamSnapshot {
  size: number;
  contracted: number;
  bookedNow: number;
  openNow: number;
  /** Team utilization over the current month and the next two. */
  nextMonthsUtilization: number;
  nextMonthsState: UtilizationState;
  nextMonths: MonthKey[];
}

export function teamSnapshot(members: TeamMember[], projects: Project[], today: ISODate, horizon = 3): TeamSnapshot {
  const rows = memberCapacityRows(members, projects, today);
  const totals = capacityTotals(rows);
  const months = monthRange(today, horizon);
  const cap = teamCapacityByMonth(members, months);
  const demand = totalDemandByMonth(projects, months);
  const capSum = months.reduce((s, m) => s + cap[m], 0);
  const demSum = months.reduce((s, m) => s + demand[m], 0);
  const utilization = safePercent(demSum, capSum);
  return {
    size: members.length,
    contracted: totals.contracted,
    bookedNow: totals.current,
    openNow: totals.open,
    nextMonthsUtilization: utilization,
    nextMonthsState: utilizationState(utilization),
    nextMonths: months,
  };
}

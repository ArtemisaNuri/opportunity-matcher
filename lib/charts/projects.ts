/**
 * Project card summaries (timeline progress, launch countdown). Pure.
 */
import { diffDays, type ISODate } from "@/lib/dates";
import type { Project } from "@/lib/domain/types";
import { projectPeakHoursPerWeek } from "@/lib/charts/workload";

export type ProjectPhase = "upcoming" | "active" | "launched";

export interface ProjectSummary {
  phase: ProjectPhase;
  /** 0–100: share of start → launch elapsed at `today`. */
  elapsedPct: number;
  daysToLaunch: number;
  daysToStart: number;
  /** "Launches in 5 weeks", "Starts in 12 days", "Launched 3 days ago". */
  countdown: string;
  memberIds: string[];
  /** Weekly hours booked on the project at `today` (0 before it starts). */
  hoursNow: number;
  peakHours: number;
}

export function relativeDays(days: number): string {
  const abs = Math.abs(days);
  if (abs === 0) return "today";
  if (abs < 14) return `${abs} day${abs === 1 ? "" : "s"}`;
  if (abs < 70) return `${Math.round(abs / 7)} weeks`;
  const months = Math.round(abs / 30.44);
  return `${months} month${months === 1 ? "" : "s"}`;
}

export function projectSummary(project: Project, today: ISODate): ProjectSummary {
  const total = Math.max(1, diffDays(project.start, project.launch));
  const elapsed = diffDays(project.start, today);
  const elapsedPct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  const daysToLaunch = diffDays(today, project.launch);
  const daysToStart = diffDays(today, project.start);
  const phase: ProjectPhase = daysToStart > 0 ? "upcoming" : daysToLaunch <= 0 ? "launched" : "active";
  let countdown: string;
  if (phase === "upcoming") countdown = `Starts in ${relativeDays(daysToStart)}`;
  else if (phase === "launched") countdown = daysToLaunch === 0 ? "Launches today" : `Launched ${relativeDays(daysToLaunch)} ago`;
  else countdown = `Launches in ${relativeDays(daysToLaunch)}`;
  const hoursNow = project.assignments.reduce((s, a) => s + (a.start <= today && today < a.end ? a.hoursPerWeek : 0), 0);
  return {
    phase,
    elapsedPct,
    daysToLaunch,
    daysToStart,
    countdown,
    memberIds: [...new Set(project.assignments.map((a) => a.memberId))],
    hoursNow,
    peakHours: projectPeakHoursPerWeek(project),
  };
}

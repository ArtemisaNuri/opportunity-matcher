import type { ISODate, MonthKey } from "@/lib/dates";

export type { ISODate, MonthKey };

export type ProjectStage = "full_build" | "prototype" | "recovery";
export type MatchCategory = "top" | "queued" | "backup" | "deferred" | "bad";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** Contracted hours per week. */
  weeklyHours: number;
  skills: string[];
}

export interface Assignment {
  memberId: string;
  hoursPerWeek: number;
  start: ISODate;
  /** Exclusive end date. */
  end: ISODate;
}

export interface Milestone {
  label: string;
  date: ISODate;
}

/** Existing, committed work. */
export interface Project {
  id: string;
  name: string;
  client: string;
  /** Categorical slot index (0-based) into the project palette. */
  colorSlot: number;
  stage: ProjectStage;
  start: ISODate;
  launch: ISODate;
  milestones: Milestone[];
  assignments: Assignment[];
}

export interface CapacityRequirements {
  hoursPerWeek: number;
  durationWeeks: number;
  preferredStart: ISODate;
  teamSize: number;
  roles: string[];
  startFlexibilityWeeks: number;
}

export type ScoringStatus = "unscored" | "queued" | "scoring" | "scored" | "error";

export interface Opportunity {
  id: string;
  title: string;
  client: string;
  sector: string;
  profile: string;
  profileTags: string[];
  stage: ProjectStage;
  clientBudget: number;
  costToBuild: number;
  requirements: CapacityRequirements;
  deadline?: ISODate;
  milestones: Milestone[];
  createdAt: string;
  source: "manual" | "seed";
  scoring: {
    status: ScoringStatus;
    result?: ScoreResult;
    scoredAt?: string;
    /** True when settings or internal data changed after this result was produced. */
    stale?: boolean;
  };
}

export interface Settings {
  minBudget: number;
  restrictedSectors: string[];
  preferredTags: string[];
  /** 0–1. Share of delivery months that must fit for the capacity gate to pass. */
  capacityGateRatio: number;
  stageFit: Record<ProjectStage, number>;
}

export type FactorKey = "capacity" | "budget" | "timeline" | "profile" | "stage" | "size";
export type Impact = "positive" | "neutral" | "negative";

export interface FactorResult {
  key: FactorKey;
  label: string;
  score: number;
  max: number;
  note: string;
  impact: Impact;
}

export interface MonthConflict {
  month: MonthKey;
  capacityHours: number;
  existingHours: number;
  opportunityHours: number;
  /** Hours by which total demand exceeds capacity (> 0). */
  overBy: number;
}

export interface StartShiftSuggestion {
  weeks: number;
  withinFlexibility: boolean;
  newStart: ISODate;
  clearedMonths: MonthKey[];
  message: string;
}

export interface ScoreResult {
  total: number;
  /** Sum of factor scores before clamping; equals total unless clamped. */
  rawTotal: number;
  category: MatchCategory;
  restrictedOverride: boolean;
  capacityGate: { passed: boolean; fitRatio: number; required: number; months: MonthKey[] };
  factors: FactorResult[];
  conflicts: MonthConflict[];
  positives: string[];
  negatives: string[];
  summary: string;
  suggestion?: StartShiftSuggestion;
  engine: string;
}

export interface ScoringContext {
  members: TeamMember[];
  projects: Project[];
  settings: Settings;
  today: ISODate;
}

export interface Scorer {
  readonly id: string;
  score(opportunity: Opportunity, ctx: ScoringContext): ScoreResult;
}

export const STAGE_LABEL: Record<ProjectStage, string> = {
  full_build: "Full Build",
  prototype: "Prototype",
  recovery: "Recovery",
};

export const CATEGORY_LABEL: Record<MatchCategory, string> = {
  top: "Top Match",
  queued: "Queued Match",
  backup: "Backup Match",
  deferred: "Deferred Match",
  bad: "Bad Match",
};

export const CATEGORY_DESCRIPTION: Record<MatchCategory, string> = {
  top: "Great fit and the team has capacity. Pursue now.",
  queued: "Great fit, but not enough capacity yet. Queue until a spot opens.",
  backup: "Solid fit. Hold as a backup option.",
  deferred: "Some overlap, not ideal. Only with extra capacity.",
  bad: "Not a fit right now.",
};

/** Lower rank sorts first ("best match"). */
export const CATEGORY_RANK: Record<MatchCategory, number> = {
  top: 0,
  queued: 1,
  backup: 2,
  deferred: 3,
  bad: 4,
};

export const CATEGORIES: MatchCategory[] = ["top", "queued", "backup", "deferred", "bad"];

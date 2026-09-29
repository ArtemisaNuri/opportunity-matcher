/**
 * Form model for the Add / Edit Opportunity sheet: plain state, defaults,
 * conversion to `OpportunityInput`, and validation. No React in here.
 */
import { addWeeks, isValidISODate, parseISO, todayISO, type ISODate } from "@/lib/dates";
import type { Opportunity, ProjectStage } from "@/lib/domain/types";
import type { OpportunityInput } from "@/lib/store/app-store";

export interface MilestoneDraft {
  /** Stable React key for the row. */
  key: string;
  label: string;
  date: string;
}

/** Numeric fields are kept as strings so the inputs can be empty while editing. */
export interface OpportunityFormState {
  title: string;
  client: string;
  sector: string;
  profile: string;
  profileTags: string[];
  stage: ProjectStage;
  clientBudget: string;
  costToBuild: string;
  deadline: string;
  milestones: MilestoneDraft[];
  hoursPerWeek: string;
  durationWeeks: string;
  preferredStart: string;
  teamSize: string;
  roles: string[];
  startFlexibilityWeeks: string;
}

export type FormErrors = Record<string, string>;

export const COMMON_SECTORS = [
  "Energy",
  "Fintech",
  "Retail",
  "Logistics",
  "Travel",
  "Media",
  "Education",
  "Nonprofit",
  "Fitness",
  "Healthcare",
  "SaaS",
];

export const ROLE_SUGGESTIONS = ["Senior Engineer", "Engineer", "Designer", "QA", "Project Manager", "Mobile", "Data"];

export const STAGE_DESCRIPTION: Record<ProjectStage, string> = {
  full_build: "An end-to-end product build, from discovery through launch.",
  prototype: "A focused prototype or MVP to validate an idea quickly.",
  recovery: "Take over and stabilize an existing project that is off track.",
};

export const LIMITS = { hoursPerWeek: 400, durationWeeks: 104, teamSize: 20, startFlexibilityWeeks: 12 } as const;

let milestoneSeq = 0;
export function milestoneKey(): string {
  milestoneSeq += 1;
  return `m-${milestoneSeq}`;
}

export function emptyForm(today: ISODate = todayISO()): OpportunityFormState {
  return {
    title: "",
    client: "",
    sector: "",
    profile: "",
    profileTags: [],
    stage: "full_build",
    clientBudget: "",
    costToBuild: "",
    deadline: "",
    milestones: [],
    hoursPerWeek: "40",
    durationWeeks: "12",
    preferredStart: addWeeks(today, 2),
    teamSize: "2",
    roles: [],
    startFlexibilityWeeks: "2",
  };
}

export function formFromOpportunity(o: Opportunity): OpportunityFormState {
  const r = o.requirements;
  return {
    title: o.title,
    client: o.client,
    sector: o.sector,
    profile: o.profile,
    profileTags: [...o.profileTags],
    stage: o.stage,
    clientBudget: String(o.clientBudget),
    costToBuild: String(o.costToBuild),
    deadline: o.deadline ?? "",
    milestones: o.milestones.map((m) => ({ key: milestoneKey(), label: m.label, date: m.date })),
    hoursPerWeek: String(r.hoursPerWeek),
    durationWeeks: String(r.durationWeeks),
    preferredStart: r.preferredStart,
    teamSize: String(r.teamSize),
    roles: [...r.roles],
    startFlexibilityWeeks: String(r.startFlexibilityWeeks),
  };
}

/** Parses a numeric field; `null` when empty or not a finite number. */
export function num(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isBlankMilestone(m: MilestoneDraft) {
  return m.label.trim() === "" && m.date.trim() === "";
}

/** Assumes the form is valid. */
export function toOpportunityInput(f: OpportunityFormState): OpportunityInput {
  return {
    title: f.title.trim(),
    client: f.client.trim(),
    sector: f.sector.trim(),
    profile: f.profile.trim(),
    profileTags: f.profileTags,
    stage: f.stage,
    clientBudget: num(f.clientBudget) ?? 0,
    costToBuild: num(f.costToBuild) ?? 0,
    requirements: {
      hoursPerWeek: num(f.hoursPerWeek) ?? 0,
      durationWeeks: num(f.durationWeeks) ?? 0,
      preferredStart: f.preferredStart,
      teamSize: Math.round(num(f.teamSize) ?? 0),
      roles: f.roles,
      startFlexibilityWeeks: num(f.startFlexibilityWeeks) ?? 0,
    },
    deadline: f.deadline ? f.deadline : undefined,
    milestones: f.milestones
      .filter((m) => !isBlankMilestone(m))
      .map((m) => ({ label: m.label.trim(), date: m.date }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function positive(errors: FormErrors, key: string, value: string, max: number, unit: string, integer = false) {
  const n = num(value);
  if (value.trim() === "") errors[key] = "Required";
  else if (n === null) errors[key] = "Enter a number";
  else if (n <= 0) errors[key] = "Must be greater than 0";
  else if (n > max) errors[key] = `Must be ${max} ${unit} or less`;
  else if (integer && !Number.isInteger(n)) errors[key] = "Enter a whole number";
}

function money(errors: FormErrors, key: string, value: string) {
  const n = num(value);
  if (value.trim() === "") errors[key] = "Required";
  else if (n === null) errors[key] = "Enter an amount";
  else if (n < 0) errors[key] = "Can't be negative";
}

export function validateForm(f: OpportunityFormState): FormErrors {
  const e: FormErrors = {};
  if (!f.title.trim()) e.title = "Give the opportunity a title";
  if (!f.client.trim()) e.client = "Who is the client?";
  if (!f.sector.trim()) e.sector = "Pick or type a sector";

  money(e, "clientBudget", f.clientBudget);
  money(e, "costToBuild", f.costToBuild);

  positive(e, "hoursPerWeek", f.hoursPerWeek, LIMITS.hoursPerWeek, "h/week");
  positive(e, "durationWeeks", f.durationWeeks, LIMITS.durationWeeks, "weeks");
  positive(e, "teamSize", f.teamSize, LIMITS.teamSize, "people", true);

  const flex = num(f.startFlexibilityWeeks);
  if (f.startFlexibilityWeeks.trim() !== "") {
    if (flex === null) e.startFlexibilityWeeks = "Enter a number";
    else if (flex < 0) e.startFlexibilityWeeks = "Can't be negative";
    else if (flex > LIMITS.startFlexibilityWeeks) e.startFlexibilityWeeks = `Must be ${LIMITS.startFlexibilityWeeks} weeks or less`;
  }

  const startValid = isValidISODate(f.preferredStart);
  if (!f.preferredStart) e.preferredStart = "Required";
  else if (!startValid) e.preferredStart = "Enter a valid date";

  if (f.deadline) {
    if (!isValidISODate(f.deadline)) e.deadline = "Enter a valid date";
    else if (startValid && parseISO(f.deadline) <= parseISO(f.preferredStart))
      e.deadline = "Deadline must be after the preferred start";
  }

  f.milestones.forEach((m, i) => {
    if (isBlankMilestone(m)) return;
    if (!m.label.trim()) e[`milestone-${i}-label`] = "Add a label";
    if (!m.date) e[`milestone-${i}-date`] = "Add a date";
    else if (!isValidISODate(m.date)) e[`milestone-${i}-date`] = "Enter a valid date";
  });
  return e;
}

/** Field keys in visual order, used to focus the first invalid field. */
export function fieldOrder(f: OpportunityFormState): string[] {
  return [
    "title",
    "client",
    "sector",
    "clientBudget",
    "costToBuild",
    "deadline",
    ...f.milestones.flatMap((_, i) => [`milestone-${i}-label`, `milestone-${i}-date`]),
    "hoursPerWeek",
    "durationWeeks",
    "preferredStart",
    "teamSize",
    "startFlexibilityWeeks",
  ];
}

export const fieldId = (key: string) => `opp-field-${key}`;

/**
 * Deterministic Smart Scoring engine.
 *
 * Opportunity data → factor scores → capacity gate → category → explanation.
 * Pure and framework-free: the same input always produces the same output.
 * An LLM-backed scorer can later implement the same `Scorer` interface.
 */
import {
  addWeeks,
  diffDays,
  formatDate,
  formatMonth,
  type ISODate,
  type MonthKey,
} from "@/lib/dates";
import {
  memberHoursOnDate,
  monthHours,
  opportunityDemandByMonth,
  opportunityMonths,
  opportunityWindow,
  teamCapacityByMonth,
  totalDemandByMonth,
} from "@/lib/capacity";
import {
  CATEGORY_LABEL,
  type FactorResult,
  type Impact,
  type MatchCategory,
  type MonthConflict,
  type Opportunity,
  type ScoreResult,
  type Scorer,
  type ScoringContext,
  type StartShiftSuggestion,
  STAGE_LABEL,
} from "@/lib/domain/types";

export const FACTOR_MAX = {
  capacity: 25,
  budget: 20,
  timeline: 20,
  profile: 15,
  stage: 10,
  size: 10,
} as const;

const MAX_SHIFT_WEEKS = 12;
/** A member counts as "available" when they have at least this many open hours/week. */
const AVAILABLE_MEMBER_MIN_OPEN_HOURS = 10;

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(n)}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

function impactOf(score: number, max: number): Impact {
  const r = max === 0 ? 0 : score / max;
  if (r >= 0.75) return "positive";
  if (r <= 0.4) return "negative";
  return "neutral";
}

export function isRestrictedSector(sector: string, restricted: string[]): boolean {
  const s = sector.trim().toLowerCase();
  return s.length > 0 && restricted.some((r) => r.trim().toLowerCase() === s);
}

/** Deterministic score → category mapping. */
export function categorize(total: number, gatePassed: boolean, restricted: boolean): MatchCategory {
  if (restricted) return "bad";
  if (total >= 90) return gatePassed ? "top" : "queued";
  if (total >= 80) return "backup";
  if (total >= 70) return "deferred";
  return "bad";
}

/** Fixed band edges from the approved table; only the minimum viable budget is configurable. */
export const BUDGET_BAND_EDGES = { floor: 5_000, mid: 20_000, high: 40_000 } as const;

/**
 * Budget band points out of 20 (approved table): <$5k → 0 · <minimum → 5 · <$20k → 12 · <$40k → 17 · $40k+ → 20.
 * With the default $10k minimum this is exactly 0 / 5 / 12 / 17 / 20.
 */
export function budgetBandPoints(budget: number, minBudget: number): number {
  if (budget < BUDGET_BAND_EDGES.floor) return 0;
  if (budget < minBudget) return 5;
  if (budget < BUDGET_BAND_EDGES.mid) return 12;
  if (budget < BUDGET_BAND_EDGES.high) return 17;
  return 20;
}

/** Sorted, de-duplicated band start points for a given minimum (for previews and "next band" tips). */
export function budgetBandStarts(minBudget: number): number[] {
  const { floor, mid, high } = BUDGET_BAND_EDGES;
  return [...new Set([0, floor, Math.max(0, minBudget), mid, high])].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- capacity

export interface CapacityEvaluation {
  months: MonthKey[];
  conflicts: MonthConflict[];
  fitRatio: number;
  passed: boolean;
}

export function evaluateCapacity(opp: Opportunity, ctx: ScoringContext, shiftWeeks = 0): CapacityEvaluation {
  const months = opportunityMonths(opp, shiftWeeks);
  const capacity = teamCapacityByMonth(ctx.members, months);
  const existing = totalDemandByMonth(ctx.projects, months);
  const demand = opportunityDemandByMonth(opp, months, shiftWeeks);
  const conflicts: MonthConflict[] = [];
  for (const m of months) {
    const total = existing[m] + demand[m];
    if (total > capacity[m] + 0.05) {
      conflicts.push({
        month: m,
        capacityHours: capacity[m],
        existingHours: existing[m],
        opportunityHours: demand[m],
        overBy: round1(total - capacity[m]),
      });
    }
  }
  const fitRatio = months.length === 0 ? 1 : (months.length - conflicts.length) / months.length;
  return { months, conflicts, fitRatio, passed: fitRatio >= ctx.settings.capacityGateRatio };
}

function capacityFactor(opp: Opportunity, ctx: ScoringContext, evalr: CapacityEvaluation): FactorResult {
  const max = FACTOR_MAX.capacity;
  let score = max * evalr.fitRatio;
  const notes: string[] = [];

  if (evalr.conflicts.length === 0) {
    notes.push(`Fits all ${evalr.months.length} delivery month${evalr.months.length === 1 ? "" : "s"}`);
  } else {
    notes.push(
      `${evalr.conflicts.length} of ${evalr.months.length} months overloaded (${evalr.conflicts
        .map((c) => formatMonth(c.month))
        .join(", ")})`,
    );
  }

  // Staffing shortfall: people with meaningful open hours at the start, and required roles present on the team.
  const start = opportunityWindow(opp).start;
  const available = ctx.members.filter(
    (m) => m.weeklyHours - memberHoursOnDate(m, ctx.projects, start) >= AVAILABLE_MEMBER_MIN_OPEN_HOURS,
  ).length;
  let penalty = 0;
  const peopleShort = Math.max(0, opp.requirements.teamSize - available);
  if (peopleShort > 0) {
    penalty += peopleShort * 2;
    notes.push(`${available} of ${opp.requirements.teamSize} needed people free at start`);
  }
  const missingRoles = opp.requirements.roles.filter((role) => {
    const r = role.toLowerCase();
    return !ctx.members.some(
      (m) => m.role.toLowerCase().includes(r) || m.skills.some((s) => s.toLowerCase().includes(r)),
    );
  });
  if (missingRoles.length > 0) {
    penalty += missingRoles.length * 2;
    notes.push(`no ${missingRoles.join(", ")} on the team`);
  }
  score = Math.max(0, score - Math.min(5, penalty));
  const rounded = round1(score);
  return {
    key: "capacity",
    label: "Team capacity",
    score: rounded,
    max,
    note: notes.join(" · "),
    impact: impactOf(rounded, max),
  };
}

// ---------------------------------------------------------------- budget

function budgetFactor(opp: Opportunity, ctx: ScoringContext): FactorResult {
  const max = FACTOR_MAX.budget;
  const band = budgetBandPoints(opp.clientBudget, ctx.settings.minBudget);
  const belowCost = opp.clientBudget < opp.costToBuild;
  const score = Math.max(0, band - (belowCost ? 5 : 0));
  let note: string;
  if (opp.clientBudget < ctx.settings.minBudget) {
    note = `${money(opp.clientBudget)} budget is under the ${money(ctx.settings.minBudget)} minimum`;
  } else {
    note = `${money(opp.clientBudget)} budget`;
  }
  note += belowCost
    ? ` · below the ${money(opp.costToBuild)} cost to build (−5)`
    : ` covers the ${money(opp.costToBuild)} cost to build`;
  return { key: "budget", label: "Budget vs. cost", score, max, note, impact: impactOf(score, max) };
}

// ---------------------------------------------------------------- timeline

function timelineFactor(opp: Opportunity, ctx: ScoringContext): FactorResult {
  const max = FACTOR_MAX.timeline;
  const { start, end } = opportunityWindow(opp);
  const required = opp.requirements.durationWeeks;
  const notes: string[] = [];
  let score: number;

  if (opp.deadline) {
    const available = diffDays(start, opp.deadline) / 7;
    const ratio = required <= 0 ? 1 : available / required;
    if (ratio >= 1.15) score = 20;
    else if (ratio >= 1) score = 16;
    else if (ratio >= 0.85) score = 10;
    else if (ratio >= 0.7) score = 5;
    else score = 0;
    notes.push(
      ratio >= 1
        ? `${Math.round(available)} wks to the ${formatDate(opp.deadline, false)} deadline for ${required} wks of work`
        : `Only ${Math.max(0, Math.round(available))} wks to the deadline for ${required} wks of work`,
    );
  } else {
    score = 20;
    notes.push(`No hard deadline · ${required} wks from ${formatDate(start, false)}`);
  }

  if (start < ctx.today) {
    score -= 4;
    notes.push("preferred start already passed (−4)");
  }

  // Existing launches in the first 4 weeks of delivery compete for the same people.
  const rampEnd = addWeeks(start, 4);
  const clashes = ctx.projects.filter((p) => p.launch >= start && p.launch < rampEnd && p.launch < end);
  if (clashes.length > 0) {
    const penalty = Math.min(8, clashes.length * 4);
    score -= penalty;
    notes.push(`${clashes.map((p) => p.name).join(", ")} launch${clashes.length === 1 ? "es" : ""} during ramp-up (−${penalty})`);
  }

  score = Math.max(0, score);
  return { key: "timeline", label: "Timeline fit", score, max, note: notes.join(" · "), impact: impactOf(score, max) };
}

// ---------------------------------------------------------------- profile

function profileFactor(opp: Opportunity, ctx: ScoringContext): FactorResult {
  const max = FACTOR_MAX.profile;
  const tags = opp.profileTags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tags.length === 0) {
    return {
      key: "profile",
      label: "Project profile fit",
      score: 7,
      max,
      note: "No profile tags yet, so scored neutral",
      impact: "neutral",
    };
  }
  const preferred = new Set(ctx.settings.preferredTags.map((t) => t.trim().toLowerCase()));
  const matched = opp.profileTags.filter((t) => preferred.has(t.trim().toLowerCase()));
  const denom = Math.max(1, Math.min(3, tags.length));
  const score = round1(max * Math.min(1, matched.length / denom));
  const note =
    matched.length > 0
      ? `Matches our focus: ${matched.join(", ")}`
      : `None of ${opp.profileTags.join(", ")} are focus areas`;
  return { key: "profile", label: "Project profile fit", score, max, note, impact: impactOf(score, max) };
}

// ---------------------------------------------------------------- stage

function stageFactor(opp: Opportunity, ctx: ScoringContext): FactorResult {
  const max = FACTOR_MAX.stage;
  const score = Math.max(0, Math.min(max, ctx.settings.stageFit[opp.stage] ?? 0));
  return {
    key: "stage",
    label: "Stage fit",
    score,
    max,
    note: `${STAGE_LABEL[opp.stage]} scores ${score}/${max}`,
    impact: impactOf(score, max),
  };
}

// ---------------------------------------------------------------- size

function sizeFactor(opp: Opportunity, ctx: ScoringContext): FactorResult {
  const max = FACTOR_MAX.size;
  const effort = opp.requirements.hoursPerWeek * opp.requirements.durationWeeks;
  const weekly = ctx.members.reduce((s, m) => s + m.weeklyHours, 0);
  const teamMonth = monthHours(weekly, "2026-01") * (30.44 / 31); // an average month
  const teamMonths = teamMonth <= 0 ? Infinity : effort / teamMonth;
  let score: number;
  if (teamMonths <= 0.5) score = 10;
  else if (teamMonths <= 1.5) score = 8;
  else if (teamMonths <= 3) score = 6;
  else if (teamMonths <= 6) score = 4;
  else score = 2;
  const note = `${Math.round(effort).toLocaleString("en-US")} hrs ≈ ${
    Number.isFinite(teamMonths) ? teamMonths.toFixed(1) : "∞"
  } team-months · ${money(opp.costToBuild)} to build`;
  return { key: "size", label: "Project size", score, max, note, impact: impactOf(score, max) };
}

// ---------------------------------------------------------------- suggestion

function findStartShift(
  opp: Opportunity,
  ctx: ScoringContext,
  base: CapacityEvaluation,
): StartShiftSuggestion | undefined {
  if (base.conflicts.length === 0) return undefined;
  const wantZero = base.passed; // gate already passes → look for a conflict-free start
  for (let w = 1; w <= MAX_SHIFT_WEEKS; w++) {
    if (addWeeks(opp.requirements.preferredStart, w) < ctx.today) continue; // never suggest a past start
    const e = evaluateCapacity(opp, ctx, w);
    const ok = wantZero ? e.conflicts.length === 0 : e.passed;
    if (!ok) continue;
    const stillConflicting = new Set(e.conflicts.map((c) => c.month));
    const cleared = base.conflicts.map((c) => c.month).filter((m) => !stillConflicting.has(m));
    const newStart = addWeeks(opp.requirements.preferredStart, w);
    const within = w <= opp.requirements.startFlexibilityWeeks;
    const clearedText =
      cleared.length > 0
        ? `clears the ${cleared.map((m) => formatMonth(m, "long").split(" ")[0]).join(" and ")} conflict${cleared.length === 1 ? "" : "s"}`
        : "brings the team back under capacity";
    return {
      weeks: w,
      withinFlexibility: within,
      newStart,
      clearedMonths: cleared,
      message: `Moving the start by ${w} week${w === 1 ? "" : "s"} (to ${formatDate(newStart, false)}) ${clearedText}${
        within ? ", within the client's flexibility." : `, beyond the client's ±${opp.requirements.startFlexibilityWeeks} wk flexibility.`
      }`,
    };
  }
  return undefined;
}

// ---------------------------------------------------------------- summary

function buildSummary(
  opp: Opportunity,
  category: MatchCategory,
  total: number,
  restricted: boolean,
  factors: FactorResult[],
  capacity: CapacityEvaluation,
): string {
  if (restricted) {
    return `${opp.sector} is a restricted sector, so this is a ${CATEGORY_LABEL.bad} regardless of its ${total}/100 score. Revisit only if the restriction changes.`;
  }
  const ranked = [...factors].sort((a, b) => b.score / b.max - a.score / a.max);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const parts = [`${CATEGORY_LABEL[category]} at ${total}/100.`];
  parts.push(`Strongest signal is ${best.label.toLowerCase()} (${best.note.charAt(0).toLowerCase()}${best.note.slice(1)}).`);
  if (worst.score / worst.max < 0.75) {
    parts.push(`Weakest is ${worst.label.toLowerCase()}: ${worst.note.charAt(0).toLowerCase()}${worst.note.slice(1)}.`);
  }
  if (capacity.conflicts.length > 0) {
    parts.push(
      capacity.passed
        ? `Capacity holds for most of the window, but ${capacity.conflicts.map((c) => formatMonth(c.month, "long")).join(", ")} run${capacity.conflicts.length === 1 ? "s" : ""} over.`
        : `The team can't absorb it yet: ${capacity.conflicts.length} of ${capacity.months.length} months exceed capacity.`,
    );
  } else if (category === "top") {
    parts.push("The team has room across the whole delivery window.");
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------- scorer

export const DeterministicScorer: Scorer = {
  id: "deterministic-v1",
  score(opp: Opportunity, ctx: ScoringContext): ScoreResult {
    const capacity = evaluateCapacity(opp, ctx);
    const factors: FactorResult[] = [
      capacityFactor(opp, ctx, capacity),
      budgetFactor(opp, ctx),
      timelineFactor(opp, ctx),
      profileFactor(opp, ctx),
      stageFactor(opp, ctx),
      sizeFactor(opp, ctx),
    ];
    const rawTotal = round1(factors.reduce((s, f) => s + f.score, 0));
    const total = Math.max(0, Math.min(100, Math.round(rawTotal)));
    const restricted = isRestrictedSector(opp.sector, ctx.settings.restrictedSectors);
    const category = categorize(total, capacity.passed, restricted);

    const positives = factors.filter((f) => f.impact === "positive").map((f) => `${f.label}: ${f.note}`);
    const negatives = factors.filter((f) => f.impact === "negative").map((f) => `${f.label}: ${f.note}`);
    if (restricted) negatives.unshift(`Restricted sector: ${opp.sector}`);

    return {
      total,
      rawTotal,
      category,
      restrictedOverride: restricted,
      capacityGate: {
        passed: capacity.passed,
        fitRatio: Math.round(capacity.fitRatio * 100) / 100,
        required: ctx.settings.capacityGateRatio,
        months: capacity.months,
      },
      factors,
      conflicts: capacity.conflicts,
      positives,
      negatives,
      summary: buildSummary(opp, category, total, restricted, factors, capacity),
      suggestion: restricted ? undefined : findStartShift(opp, ctx, capacity),
      engine: DeterministicScorer.id,
    };
  },
};

export function scoreOpportunity(opp: Opportunity, ctx: ScoringContext): ScoreResult {
  return DeterministicScorer.score(opp, ctx);
}

export type { ISODate };

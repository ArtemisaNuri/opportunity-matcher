import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetBandPoints, categorize, evaluateCapacity, scoreOpportunity } from "@/lib/scoring/engine";
import { buildSeed, DEFAULT_SETTINGS } from "@/lib/data/seed";
import type { Opportunity, ScoringContext, TeamMember } from "@/lib/domain/types";

const NOW = new Date("2026-09-25T10:00:00Z");
const TODAY = "2026-09-25";

function ctxFromSeed(): ScoringContext {
  const s = buildSeed(NOW);
  return { members: s.members, projects: s.projects, settings: s.settings, today: TODAY };
}

function idealOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "o-test",
    title: "Test",
    client: "Client",
    sector: "Energy",
    profile: "",
    profileTags: ["Web App", "Dashboard", "Next.js"],
    stage: "full_build",
    clientBudget: 100_000,
    costToBuild: 40_000,
    requirements: {
      hoursPerWeek: 20,
      durationWeeks: 6,
      preferredStart: "2027-05-03",
      teamSize: 1,
      roles: [],
      startFlexibilityWeeks: 2,
    },
    milestones: [],
    createdAt: NOW.toISOString(),
    source: "manual",
    scoring: { status: "unscored" },
    ...overrides,
  };
}

test("categorize: boundary scores map deterministically", () => {
  assert.equal(categorize(92, true, false), "top");
  assert.equal(categorize(92, false, false), "queued");
  assert.equal(categorize(90, true, false), "top");
  assert.equal(categorize(90, false, false), "queued");
  assert.equal(categorize(89, true, false), "backup");
  assert.equal(categorize(80, false, false), "backup");
  assert.equal(categorize(79, true, false), "deferred");
  assert.equal(categorize(70, true, false), "deferred");
  assert.equal(categorize(69, true, false), "bad");
  assert.equal(categorize(100, true, true), "bad");
});

test("budget bands match the approved table exactly (default $10k minimum)", () => {
  const cases: [number, number][] = [
    [4_999, 0],
    [5_000, 5],
    [9_999, 5],
    [10_000, 12],
    [19_999, 12],
    [20_000, 17],
    [39_999, 17],
    [40_000, 20],
  ];
  for (const [budget, points] of cases) {
    assert.equal(budgetBandPoints(budget, DEFAULT_SETTINGS.minBudget), points, `budget ${budget}`);
  }
});

test("restricted sector forces Bad Match even with every other factor at maximum", () => {
  const ctx = ctxFromSeed();
  const healthy = scoreOpportunity(idealOpportunity(), ctx);
  const restricted = scoreOpportunity(idealOpportunity({ sector: "healthcare" }), ctx);
  assert.ok(healthy.total >= 90, `baseline should be high, got ${healthy.total}`);
  assert.equal(restricted.total, healthy.total);
  assert.equal(restricted.category, "bad");
  assert.equal(restricted.restrictedOverride, true);
  assert.equal(restricted.suggestion, undefined);
});

test("scoring is deterministic", () => {
  const ctx = ctxFromSeed();
  const s = buildSeed(NOW);
  for (const o of s.opportunities) {
    assert.deepEqual(scoreOpportunity(o, ctx), scoreOpportunity(o, ctx));
  }
});

test("factor scores sum to the raw total and respect their maxima", () => {
  const ctx = ctxFromSeed();
  for (const o of buildSeed(NOW).opportunities) {
    const r = scoreOpportunity(o, ctx);
    const sum = Math.round(r.factors.reduce((s, f) => s + f.score, 0) * 10) / 10;
    assert.equal(sum, r.rawTotal, o.title);
    assert.deepEqual(
      r.factors.map((f) => f.max),
      [25, 20, 20, 15, 10, 10],
    );
    for (const f of r.factors) assert.ok(f.score >= 0 && f.score <= f.max, `${o.title} ${f.key}`);
    assert.ok(r.total >= 0 && r.total <= 100);
  }
});

test("capacity gate: fails below the 80% fit ratio and lists overloaded months", () => {
  const ctx = ctxFromSeed();
  const vela = buildSeed(NOW).opportunities.find((o) => o.id === "o-vela")!;
  const r = scoreOpportunity(vela, ctx);
  assert.equal(r.capacityGate.passed, false);
  assert.ok(r.capacityGate.fitRatio < 0.8);
  assert.ok(r.conflicts.length > 0);
  for (const c of r.conflicts) {
    assert.ok(c.existingHours + c.opportunityHours > c.capacityHours);
    assert.ok(c.overBy > 0);
  }
  assert.equal(r.category, "queued");
});

test("start-shift suggestion clears conflicts and never proposes a past date", () => {
  const ctx = ctxFromSeed();
  const vela = buildSeed(NOW).opportunities.find((o) => o.id === "o-vela")!;
  const r = scoreOpportunity(vela, ctx);
  assert.ok(r.suggestion, "expected a suggestion");
  assert.ok(r.suggestion!.newStart >= TODAY);
  const shifted = evaluateCapacity(vela, ctx, r.suggestion!.weeks);
  assert.ok(shifted.passed);
});

test("a team with zero capacity does not divide by zero", () => {
  const ctx = ctxFromSeed();
  const zeroTeam: TeamMember[] = ctx.members.map((m) => ({ ...m, weeklyHours: 0 }));
  const r = scoreOpportunity(idealOpportunity(), { ...ctx, members: zeroTeam, projects: [] });
  assert.ok(Number.isFinite(r.total));
  assert.equal(r.capacityGate.passed, false);
});

test("seed data spans every category once scored", () => {
  const ctx = ctxFromSeed();
  const cats = new Set(buildSeed(NOW).opportunities.map((o) => scoreOpportunity(o, ctx).category));
  for (const c of ["top", "queued", "backup", "deferred", "bad"]) assert.ok(cats.has(c as never), `missing ${c}`);
});

test("budget band edges stay fixed when the minimum changes (only the minimum moves)", () => {
  assert.equal(budgetBandPoints(45_000, 15_000), 20);
  assert.equal(budgetBandPoints(8_000, 20_000), 5);
  assert.equal(budgetBandPoints(30_000, 25_000), 17);
  assert.equal(budgetBandPoints(12_000, 15_000), 5);
  assert.equal(budgetBandPoints(4_000, 3_000), 0);
});

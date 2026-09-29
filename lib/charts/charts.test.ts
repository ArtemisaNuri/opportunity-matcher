import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed } from "@/lib/data/seed";
import { scoreOpportunity } from "@/lib/scoring/engine";
import { teamCapacityByMonth, totalDemandByMonth } from "@/lib/capacity";
import type { Opportunity, ScoringContext } from "@/lib/domain/types";
import { SERIES_VARS, OPPORTUNITY_COLOR } from "@/lib/palette";
import {
  buildComparisonModel,
  buildWorkloadRows,
  chartWindow,
  comparisonSeries,
  opportunitySeries,
  projectSeries,
} from "@/lib/charts/workload";
import { datePosition, ganttSpan, ganttWindow, monthColumns } from "@/lib/charts/gantt";
import {
  capacityTotals,
  heatmapRows,
  heatmapTotals,
  memberCapacityRows,
  projectGroups,
  teamSnapshot,
} from "@/lib/charts/team";
import { projectSummary } from "@/lib/charts/projects";

const NOW = new Date("2026-09-25T10:00:00Z");
const TODAY = "2026-09-25";

function seed() {
  const s = buildSeed(NOW);
  const ctx: ScoringContext = { members: s.members, projects: s.projects, settings: s.settings, today: TODAY };
  // Score everything so the Top/Queued/Backup sets are populated like after "Score all".
  const opportunities: Opportunity[] = s.opportunities.map((o) => ({
    ...o,
    scoring: { status: "scored", result: scoreOpportunity(o, ctx) },
  }));
  return { ...s, opportunities, ctx };
}

// ------------------------------------------------------------------ window

test("chartWindow: starts at the current month, covers the target, clamps to 9–12 months", () => {
  assert.deepEqual(chartWindow(TODAY).slice(0, 2), ["2026-09", "2026-10"]);
  assert.equal(chartWindow(TODAY).length, 9);
  assert.equal(chartWindow(TODAY, "2026-11-10").length, 9, "short windows are padded to 9");
  assert.equal(chartWindow(TODAY, "2027-07-02").length, 11, "Sep 2026 → Jul 2027 inclusive");
  assert.equal(chartWindow(TODAY, "2027-07-01").length, 10, "an exclusive end on the 1st does not add a month");
  assert.equal(chartWindow(TODAY, "2028-12-01").length, 12, "long windows are capped at 12");
  assert.equal(chartWindow(TODAY, undefined, { min: 12, max: 12 }).length, 12);
});

// ------------------------------------------------------------------ engine parity

test("Vela vs existing projects: overloaded months equal the engine's conflicts exactly", () => {
  const { ctx, opportunities } = seed();
  const vela = opportunities.find((o) => o.id === "o-vela")!;
  const result = scoreOpportunity(vela, ctx);
  const model = buildComparisonModel({
    opportunity: vela,
    set: "existing",
    members: ctx.members,
    projects: ctx.projects,
    opportunities,
    today: TODAY,
  });
  const chartMonths = model.overloadWith.map((m) => m.month);
  const engineMonths = result.conflicts.map((c) => c.month);
  assert.ok(engineMonths.length > 0, "the seed's Vela case must have at least one conflict");
  assert.deepEqual(chartMonths, engineMonths);
  for (const c of result.conflicts) {
    const row = model.withOpportunity.find((r) => r.month === c.month)!;
    assert.equal(row.overBy, c.overBy, `overBy for ${c.month}`);
    assert.equal(row.capacity, c.capacityHours);
    assert.equal(row.setTotal, c.existingHours);
    assert.equal(row.opportunity, c.opportunityHours);
  }
});

test("every seeded opportunity: chart overloads inside its delivery window equal the engine's conflicts", () => {
  const { ctx, opportunities } = seed();
  for (const opp of opportunities) {
    const result = scoreOpportunity(opp, ctx);
    const model = buildComparisonModel({ opportunity: opp, set: "existing", members: ctx.members, projects: ctx.projects, opportunities, today: TODAY });
    const delivery = new Set(result.capacityGate.months);
    const chart = model.overloadWith.filter((m) => delivery.has(m.month)).map((m) => m.month);
    const engine = result.conflicts.map((c) => c.month).filter((m) => model.months.includes(m));
    assert.deepEqual(chart, engine, opp.id);
  }
});

test("existing set totals match totalDemandByMonth and capacity matches teamCapacityByMonth", () => {
  const { ctx } = seed();
  const months = chartWindow(TODAY, undefined, { min: 12, max: 12 });
  const series = projectSeries(ctx.projects, months);
  const capacity = teamCapacityByMonth(ctx.members, months);
  const rows = buildWorkloadRows({ months, series, capacity });
  const expected = totalDemandByMonth(ctx.projects, months);
  for (const r of rows) {
    assert.equal(r.setTotal, expected[r.month], r.month);
    assert.equal(r.capacity, capacity[r.month]);
    assert.equal(r.opportunity, 0);
    for (const s of series) assert.equal(r[s.key], s.demand[r.month] ?? 0);
  }
});

test("current workload has no opportunity hours; with-opportunity stacks it on top", () => {
  const { ctx, opportunities } = seed();
  const vela = opportunities.find((o) => o.id === "o-vela")!;
  const m = buildComparisonModel({ opportunity: vela, set: "existing", members: ctx.members, projects: ctx.projects, opportunities, today: TODAY });
  assert.ok(m.current.every((r) => r.opportunity === 0));
  assert.ok(m.withOpportunity.some((r) => r.opportunity > 0));
  for (let i = 0; i < m.months.length; i++) {
    assert.equal(m.withOpportunity[i].setTotal, m.current[i].setTotal);
    assert.equal(m.withOpportunity[i].total, Math.round((m.current[i].setTotal + m.withOpportunity[i].opportunity) * 10) / 10);
  }
  assert.ok(m.overloadCurrent.length <= m.overloadWith.length);
});

// ------------------------------------------------------------------ colors & sets

test("project colors follow colorSlot, never order", () => {
  const { ctx } = seed();
  const months = chartWindow(TODAY);
  const reversed = projectSeries([...ctx.projects].reverse(), months);
  for (const s of reversed) {
    const p = ctx.projects.find((x) => x.id === s.id)!;
    assert.equal(s.color, SERIES_VARS[p.colorSlot % SERIES_VARS.length]);
  }
});

test("opportunity sets exclude the evaluated one, are id-sorted, and never use violet", () => {
  const { opportunities } = seed();
  const months = chartWindow(TODAY);
  const top = opportunitySeries(opportunities, "top", months, "o-lumen");
  assert.ok(top.length > 0);
  assert.ok(top.every((s) => s.id !== "o-lumen"));
  assert.deepEqual(top.map((s) => s.id), [...top.map((s) => s.id)].sort());
  assert.ok(top.every((s) => s.color !== OPPORTUNITY_COLOR));
  assert.equal(new Set(top.map((s) => s.color)).size, top.length, "no duplicate colors inside a set");
  // A different score ranking must not repaint the series.
  const shuffled = [...opportunities].reverse();
  assert.deepEqual(
    opportunitySeries(shuffled, "top", months, "o-lumen").map((s) => s.color),
    top.map((s) => s.color),
  );
});

test("an empty comparison set yields no series and rows that equal the opportunity alone", () => {
  const { ctx, opportunities } = seed();
  const vela = opportunities.find((o) => o.id === "o-vela")!;
  // Vela is the only Queued match in the seed, so "Queued" (excluding itself) is empty.
  assert.equal(comparisonSeries("queued", { projects: ctx.projects, opportunities }, chartWindow(TODAY), "o-vela").length, 0);
  const m = buildComparisonModel({ opportunity: vela, set: "queued", members: ctx.members, projects: ctx.projects, opportunities, today: TODAY });
  assert.equal(m.series.length, 0);
  assert.ok(m.withOpportunity.every((r) => r.setTotal === 0 && r.total === r.opportunity));
});

// ------------------------------------------------------------------ gantt

test("gantt geometry is day-precise and clipped to the window", () => {
  const w = ganttWindow(["2026-09", "2026-10"]); // 30 + 31 = 61 days
  assert.equal(w.days, 61);
  assert.equal(datePosition(w, "2026-09-01"), 0);
  assert.equal(datePosition(w, "2026-11-01"), 100);
  assert.equal(datePosition(w, "2026-08-31"), null);
  const span = ganttSpan(w, "2026-08-15", "2026-09-16")!;
  assert.equal(span.left, 0);
  assert.ok(Math.abs(span.width - (15 / 61) * 100) < 1e-9);
  assert.equal(span.clippedStart, true);
  assert.equal(span.clippedEnd, false);
  assert.equal(ganttSpan(w, "2026-11-01", "2026-12-01"), null);
  assert.equal(ganttSpan(w, "2026-07-01", "2026-09-01"), null);
  const cols = monthColumns(w, ["2026-09", "2026-10"]);
  assert.equal(cols[0].left, 0);
  assert.ok(Math.abs(cols[1].left - (30 / 61) * 100) < 1e-9);
  assert.ok(Math.abs(cols[0].width + cols[1].width - 100) < 1e-9);
});

// ------------------------------------------------------------------ team

test("member capacity rows: open = contracted − current, sorted by open desc", () => {
  const { ctx } = seed();
  const rows = memberCapacityRows(ctx.members, ctx.projects, TODAY);
  assert.equal(rows.length, ctx.members.length);
  for (const r of rows) assert.equal(r.open, r.contracted - r.current);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].open >= rows[i].open);
  const t = capacityTotals(rows);
  assert.equal(t.contracted, ctx.members.reduce((s, m) => s + m.weeklyHours, 0));
  assert.equal(t.open - t.overbooked, t.contracted - t.current);
});

test("project groups: active projects hold everyone booked; unassigned holds everyone else", () => {
  const { ctx } = seed();
  const g = projectGroups(ctx.members, ctx.projects, TODAY);
  const inActive = new Set(g.active.flatMap((p) => p.members.map((m) => m.member.id)));
  const unassigned = new Set(g.unassigned.map((r) => r.member.id));
  for (const m of ctx.members) assert.ok(inActive.has(m.id) !== unassigned.has(m.id), m.id);
  for (const grp of g.active) assert.equal(grp.totalHours, grp.members.reduce((s, r) => s + r.hours, 0));
  // Atlas and Northwind start after today in the seed.
  assert.deepEqual(g.later.map((x) => x.project.id).sort(), ["p-atlas", "p-northwind"]);
  // A date with nothing booked puts the whole team in "Not on a project".
  assert.equal(projectGroups(ctx.members, ctx.projects, "2030-01-01").unassigned.length, ctx.members.length);
});

test("heatmap totals sum booked and capacity across members", () => {
  const { ctx } = seed();
  const months = chartWindow(TODAY, undefined, { min: 6, max: 6 });
  const rows = heatmapRows(ctx.members, ctx.projects, months);
  const totals = heatmapTotals(rows, months);
  assert.equal(totals.length, 6);
  const cap = teamCapacityByMonth(ctx.members, months);
  const dem = totalDemandByMonth(ctx.projects, months);
  for (const t of totals) {
    assert.ok(Math.abs(t.capacity - cap[t.month]) < 0.5, t.month);
    assert.ok(Math.abs(t.booked - dem[t.month]) < 0.5, t.month);
  }
});

test("team snapshot KPIs are consistent", () => {
  const { ctx } = seed();
  const s = teamSnapshot(ctx.members, ctx.projects, TODAY);
  assert.equal(s.size, 8);
  assert.deepEqual(s.nextMonths, ["2026-09", "2026-10", "2026-11"]);
  assert.ok(s.nextMonthsUtilization > 0 && s.nextMonthsUtilization < 200);
  assert.ok(s.openNow >= s.contracted - s.bookedNow);
});

test("project summary: progress and countdown", () => {
  const { ctx } = seed();
  const harbor = ctx.projects.find((p) => p.id === "p-harbor")!;
  const s = projectSummary(harbor, TODAY);
  assert.equal(s.phase, "active");
  assert.ok(s.elapsedPct > 0 && s.elapsedPct < 100);
  assert.ok(/^Launches in /.test(s.countdown), s.countdown);
  const atlas = projectSummary(ctx.projects.find((p) => p.id === "p-atlas")!, TODAY);
  assert.equal(atlas.phase, "upcoming");
  assert.equal(atlas.elapsedPct, 0);
  assert.ok(/^Starts in /.test(atlas.countdown), atlas.countdown);
  assert.equal(projectSummary(harbor, "2030-01-01").phase, "launched");
});

test("comparison chart covers past and long delivery windows, so red months equal engine conflicts", async () => {
  const { buildSeed } = await import("@/lib/data/seed");
  const { scoreOpportunity } = await import("@/lib/scoring/engine");
  const { buildComparisonModel } = await import("@/lib/charts/workload");
  const s = buildSeed(new Date("2026-09-25T10:00:00Z"));
  const ctx = { members: s.members, projects: s.projects, settings: s.settings, today: "2026-09-25" };
  const base = s.opportunities.find((o) => o.id === "o-vela")!;
  for (const [start, weeks] of [["2026-07-25", 12], ["2027-06-25", 30]] as const) {
    const opp = { ...base, requirements: { ...base.requirements, preferredStart: start, durationWeeks: weeks, hoursPerWeek: 400 } };
    const engine = scoreOpportunity(opp, ctx).conflicts.map((c) => c.month);
    const model: any = (buildComparisonModel as any)({ opportunity: opp, set: "existing", projects: s.projects, opportunities: s.opportunities, members: s.members, today: "2026-09-25" });
    const rows = model.withOpportunity ?? model.rows?.withOpportunity;
    const red = rows.filter((r: any) => r.overloaded).map((r: any) => r.month);
    assert.deepEqual(red, engine, `start ${start}`);
  }
});

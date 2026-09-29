import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hoursInMonth,
  memberLoadByMonth,
  opportunityMonths,
  safePercent,
  utilizationState,
} from "@/lib/capacity";
import type { Project, TeamMember } from "@/lib/domain/types";

test("partial-month overlap is prorated by days", () => {
  // 14 of September's 30 days at 7 h/week = 14 hours.
  assert.equal(hoursInMonth(7, "2026-09-17", "2026-10-15", "2026-09"), 14);
  // October: 14 days (1st–14th) at 7 h/week = 14 hours.
  assert.equal(hoursInMonth(7, "2026-09-17", "2026-10-15", "2026-10"), 14);
  assert.equal(hoursInMonth(7, "2026-09-17", "2026-10-15", "2026-11"), 0);
});

test("utilization states follow the approved bands", () => {
  assert.equal(utilizationState(0), "low");
  assert.equal(utilizationState(50), "low");
  assert.equal(utilizationState(51), "healthy");
  assert.equal(utilizationState(75), "healthy");
  assert.equal(utilizationState(76), "busy");
  assert.equal(utilizationState(90), "busy");
  assert.equal(utilizationState(91), "near");
  assert.equal(utilizationState(100), "near");
  assert.equal(utilizationState(101), "overloaded");
});

test("zero-capacity months do not divide by zero", () => {
  assert.equal(safePercent(0, 0), 0);
  assert.equal(safePercent(10, 0), 999);
  const member: TeamMember = { id: "m", name: "M", role: "Engineer", weeklyHours: 0, skills: [] };
  const project: Project = {
    id: "p",
    name: "P",
    client: "C",
    colorSlot: 0,
    stage: "full_build",
    start: "2026-09-01",
    launch: "2026-12-01",
    milestones: [],
    assignments: [{ memberId: "m", hoursPerWeek: 10, start: "2026-09-01", end: "2026-12-01" }],
  };
  const [load] = memberLoadByMonth(member, [project], ["2026-10"]);
  assert.equal(load.capacity, 0);
  assert.equal(load.state, "overloaded");
});

test("opportunity months cover the delivery window", () => {
  const months = opportunityMonths({
    requirements: {
      hoursPerWeek: 40,
      durationWeeks: 6,
      preferredStart: "2026-09-21",
      teamSize: 1,
      roles: [],
      startFlexibilityWeeks: 0,
    },
  });
  assert.deepEqual(months, ["2026-09", "2026-10", "2026-11"]);
});

/**
 * Chart color roles. Values live in CSS variables (app/globals.css) so light and
 * dark themes swap in one place. The project palette is the validated dataviz
 * categorical order; violet is reserved for the opportunity being evaluated.
 */
import type { MatchCategory } from "@/lib/domain/types";
import type { UtilizationState } from "@/lib/capacity";

export const SERIES_VARS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
] as const;

/** Color follows the entity: a project's slot is fixed in its data, never its rank. */
export function projectColor(slot: number): string {
  return SERIES_VARS[((slot % SERIES_VARS.length) + SERIES_VARS.length) % SERIES_VARS.length];
}

export const OPPORTUNITY_COLOR = "var(--series-opp)";
export const CAPACITY_LINE_COLOR = "var(--capacity-line)";
export const GRID_COLOR = "var(--chart-grid)";
export const AXIS_COLOR = "var(--chart-axis)";

export const HEAT_VARS: Record<UtilizationState, string> = {
  low: "var(--heat-low)",
  healthy: "var(--heat-healthy)",
  busy: "var(--heat-busy)",
  near: "var(--heat-near)",
  overloaded: "var(--heat-over)",
};

/** Tailwind classes per category: text + soft background + ring. */
export const CATEGORY_CLASSES: Record<MatchCategory, { text: string; bg: string; dot: string; ring: string }> = {
  top: { text: "text-cat-top", bg: "bg-cat-top-soft", dot: "bg-cat-top", ring: "ring-cat-top/30" },
  queued: { text: "text-cat-queued", bg: "bg-cat-queued-soft", dot: "bg-cat-queued", ring: "ring-cat-queued/30" },
  backup: { text: "text-cat-backup", bg: "bg-cat-backup-soft", dot: "bg-cat-backup", ring: "ring-cat-backup/30" },
  deferred: { text: "text-cat-deferred", bg: "bg-cat-deferred-soft", dot: "bg-cat-deferred", ring: "ring-cat-deferred/30" },
  bad: { text: "text-cat-bad", bg: "bg-cat-bad-soft", dot: "bg-cat-bad", ring: "ring-cat-bad/30" },
};

export const CATEGORY_COLOR_VAR: Record<MatchCategory, string> = {
  top: "var(--cat-top)",
  queued: "var(--cat-queued)",
  backup: "var(--cat-backup)",
  deferred: "var(--cat-deferred)",
  bad: "var(--cat-bad)",
};

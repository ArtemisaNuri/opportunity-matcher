"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarClockIcon, CheckIcon, LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import type { Opportunity, ScoreResult, Settings } from "@/lib/domain/types";
import { FACTOR_MAX, budgetBandPoints, budgetBandStarts } from "@/lib/scoring/engine";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { useAppStore } from "@/lib/store/react";
import { Button } from "@/components/ui/button";
import { fmtPts, toOpportunityInput } from "@/components/detail/shared";
import { cn } from "@/lib/utils";

export interface ImprovementTip {
  id: string;
  text: string;
  points: number;
  /** Badge text when a tip carries a range, e.g. "+7–12". */
  badge?: string;
}

const money = (n: number) => formatMoney(n, { compact: true });

/**
 * Simple, deterministic "what would improve it" tips, derived from the same rules the engine uses
 * (budget bands via `budgetBandPoints`, the profile-fit ratio). No estimates, no guesses.
 */
export function deriveTips(opp: Opportunity, settings: Settings): ImprovementTip[] {
  const tips: ImprovementTip[] = [];
  const low: ImprovementTip[] = [];

  // Budget vs cost
  const { clientBudget: b, costToBuild: c } = opp;
  const min = settings.minBudget;
  const budgetScore = (x: number) => Math.max(0, budgetBandPoints(x, min) - (x < c ? 5 : 0));
  const current = budgetScore(b);
  if (b < min) {
    const gainMin = budgetScore(min) - current;
    const gainCost = c > min ? budgetScore(c) - current : 0;
    if (gainMin > 0) {
      tips.push({
        id: "budget-min",
        points: Math.max(gainMin, gainCost),
        badge: gainCost > gainMin ? `+${fmtPts(gainMin)}–${fmtPts(gainCost)}` : undefined,
        text:
          `A budget of at least ${money(min)} would add ${fmtPts(gainMin)} points` +
          (gainCost > gainMin ? `; covering the full ${money(c)} cost to build would add ${fmtPts(gainCost)}.` : "."),
      });
    }
  } else if (b < c) {
    const gain = budgetScore(c) - current;
    if (gain > 0)
      tips.push({
        id: "budget-cost",
        points: gain,
        text: `A budget that covers the ${money(c)} cost to build would add ${fmtPts(gain)} points.`,
      });
  } else if (current < FACTOR_MAX.budget) {
    const next = budgetBandStarts(min).find((t) => t > b && budgetBandPoints(t, min) > budgetBandPoints(b, min));
    const gain = next !== undefined ? budgetScore(next) - current : 0;
    if (next !== undefined && gain > 0)
      low.push({
        id: "budget-band",
        points: gain,
        text: `The next budget band starts at ${money(next)}; reaching it would add ${fmtPts(gain)} points.`,
      });
  }

  // Profile fit
  const preferred = settings.preferredTags.filter(Boolean);
  const has = new Set(opp.profileTags.map((t) => t.trim().toLowerCase()));
  const pref = new Set(preferred.map((t) => t.trim().toLowerCase()));
  const matched = opp.profileTags.filter((t) => pref.has(t.trim().toLowerCase())).length;
  const t = opp.profileTags.filter((x) => x.trim()).length;
  const profileScore = (m: number, n: number) =>
    n === 0 ? 7 : Math.round(FACTOR_MAX.profile * Math.min(1, m / Math.max(1, Math.min(3, n))) * 10) / 10;
  const candidate = preferred.find((p) => !has.has(p.trim().toLowerCase()));
  if (candidate) {
    const gain = Math.round((profileScore(matched + 1, t + 1) - profileScore(matched, t)) * 10) / 10;
    if (gain > 0) {
      tips.push({
        id: "profile",
        points: gain,
        text:
          t === 0
            ? `Add profile tags if it matches a focus area: one matching tag (e.g. ${candidate}) would add ${fmtPts(gain)} points.`
            : matched === 0
              ? `None of the tags are focus areas. If the work genuinely fits one (e.g. ${candidate}), tagging it would add ${fmtPts(gain)} points.`
              : `If it also fits another focus area (e.g. ${candidate}), tagging it would add ${fmtPts(gain)} points.`,
      });
    }
  }

  return [...tips, ...low].slice(0, 2);
}

export function Improvements({
  opportunity,
  result,
  settings,
}: {
  opportunity: Opportunity;
  result: ScoreResult;
  settings: Settings;
}) {
  const store = useAppStore();
  const tips = React.useMemo(() => deriveTips(opportunity, settings), [opportunity, settings]);
  const suggestion = opportunity.scoring.stale ? undefined : result.suggestion;

  const applyShift = () => {
    if (!suggestion) return;
    const input = toOpportunityInput(opportunity);
    store.updateOpportunity(
      opportunity.id,
      { ...input, requirements: { ...input.requirements, preferredStart: suggestion.newStart } },
      { scoreNow: true },
    );
    toast.success(`Start moved to ${formatDate(suggestion.newStart)}`, {
      description: "Re-scoring with the new start date.",
    });
  };

  if (result.restrictedOverride) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
        The sector restriction overrides the score, so no change to these inputs would lift it above a Bad Match.
      </p>
    );
  }

  if (!suggestion && tips.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
        <CheckIcon className="size-4 shrink-0" aria-hidden />
        Nothing simple to improve: the remaining points depend on team load and the deadline.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {suggestion ? (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] p-4">
          <div className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <CalendarClockIcon className="size-4" aria-hidden />
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-relaxed font-medium text-pretty">{suggestion.message}</p>
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                  suggestion.withinFlexibility ? "bg-good/10 text-good" : "bg-warning/10 text-warning",
                )}
              >
                {suggestion.withinFlexibility ? (
                  <CheckIcon className="size-3" aria-hidden />
                ) : (
                  <TriangleAlertIcon className="size-3" aria-hidden />
                )}
                {suggestion.withinFlexibility
                  ? "Within the client's flexibility"
                  : "Beyond flexibility: confirm with the client first"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={suggestion.withinFlexibility ? "default" : "outline"}
            onClick={applyShift}
            className="self-start sm:ml-11"
          >
            <CalendarClockIcon aria-hidden />
            Apply new start date
          </Button>
        </div>
      ) : null}
      {tips.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {tips.map((tip) => (
            <li key={tip.id} className="flex items-start gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span className="flex-1 text-pretty">{tip.text}</span>
              <span className="shrink-0 rounded-md bg-good/10 px-1.5 py-0.5 text-xs font-semibold text-good tabular">
                {tip.badge ?? `+${fmtPts(tip.points)}`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

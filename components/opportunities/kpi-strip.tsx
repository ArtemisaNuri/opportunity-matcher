"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CircleDashedIcon, GaugeIcon, UsersIcon } from "lucide-react";
import { CATEGORIES, CATEGORY_DESCRIPTION, CATEGORY_LABEL, type MatchCategory } from "@/lib/domain/types";
import { CATEGORY_CLASSES } from "@/lib/palette";
import { UTILIZATION_LABEL, type UtilizationState } from "@/lib/capacity";
import { formatMonth, type MonthKey } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/effects/animated-number";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface KpiStats {
  counts: Record<MatchCategory, number>;
  scoredTotal: number;
  /** All opportunities, scored or not. */
  total: number;
  /** Sum of client budgets for Top + Queued matches. */
  pipelineBudget: number;
  month: MonthKey;
  utilization: { percent: number; booked: number; capacity: number; state: UtilizationState };
  openHours: { open: number; contracted: number; members: number };
  unscored: number;
  inQueue: number;
}

/** Category distribution (segmented bar + clickable category tiles) and three summary tiles. */
export function KpiStrip({
  stats,
  activeCategories,
  onToggleCategory,
}: {
  stats: KpiStats;
  activeCategories: MatchCategory[];
  onToggleCategory: (c: MatchCategory) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
      <CategoryDistributionCard stats={stats} active={activeCategories} onToggle={onToggleCategory} />
      <section
        aria-label="Capacity now"
        className="grid divide-y rounded-xl border bg-card shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y"
      >
        <UtilizationTile stats={stats} />
        <SummaryTile
          icon={<UsersIcon aria-hidden />}
          label="Open hours this week"
          value={<AnimatedNumber value={Math.max(0, stats.openHours.open)} />}
          unit="h/wk"
          detail={`of ${stats.openHours.contracted.toLocaleString("en-US")} h/wk contracted · ${stats.openHours.members} people`}
          tone={stats.openHours.open <= 0 ? "critical" : undefined}
        />
        <SummaryTile
          icon={<CircleDashedIcon aria-hidden />}
          label="Unscored"
          value={<AnimatedNumber value={stats.unscored} />}
          detail={
            stats.inQueue > 0
              ? `${stats.inQueue} in the scoring queue`
              : stats.unscored === 0
                ? "Everything has been scored"
                : "Waiting for Smart Scoring"
          }
        />
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ distribution

const CATEGORY_RULE: Record<MatchCategory, string> = {
  top: "90+ · capacity",
  queued: "90+ · no capacity",
  backup: "Score 80–89",
  deferred: "Score 70–79",
  bad: "Under 70",
};

function CategoryDistributionCard({
  stats,
  active,
  onToggle,
}: {
  stats: KpiStats;
  active: MatchCategory[];
  onToggle: (c: MatchCategory) => void;
}) {
  const { counts, scoredTotal } = stats;
  const filtering = active.length > 0;
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">Match distribution</h2>
          <p className="text-xs text-muted-foreground">Select a category to filter the table.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Scored</span>
          <span className="text-2xl leading-none font-semibold tracking-tight tabular">
            <AnimatedNumber value={scoredTotal} />
            <span className="text-sm font-medium text-muted-foreground"> / {stats.total}</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Top + Queued budget</span>
          <span className="text-2xl leading-none font-semibold tracking-tight tabular">
            <AnimatedNumber value={stats.pipelineBudget} format={(n) => formatMoney(Math.round(n / 1000) * 1000, { compact: true })} />
          </span>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-4">
      <DistributionBar counts={counts} total={scoredTotal} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-label="Filter by match category">
        {CATEGORIES.map((c) => {
          const cls = CATEGORY_CLASSES[c];
          const isActive = active.includes(c);
          const share = scoredTotal ? Math.round((counts[c] / scoredTotal) * 100) : 0;
          return (
            <Tooltip key={c}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onToggle(c)}
                  className={cn(
                    "group flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-all outline-none last:col-span-2 hover:border-foreground/15 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:last:col-span-1",
                    isActive && cn("ring-1 ring-inset hover:bg-transparent", cls.bg, cls.ring, "border-transparent"),
                    filtering && !isActive && "opacity-60 hover:opacity-100",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className={cn("size-2 shrink-0 rounded-full", cls.dot)} aria-hidden />
                    <span className={cn("truncate", isActive && cls.text)}>{CATEGORY_LABEL[c].replace(" Match", "")}</span>
                  </span>
                  <span className="flex items-baseline gap-1.5">
                    <AnimatedNumber value={counts[c]} className="text-2xl leading-none font-semibold tracking-tight tabular" />
                    <span className="text-xs text-muted-foreground tabular">{scoredTotal ? `${share}%` : ""}</span>
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground" aria-hidden>
                    {CATEGORY_RULE[c]}
                  </span>
                  <span className="sr-only">
                    {CATEGORY_LABEL[c]}: {counts[c]}. {CATEGORY_DESCRIPTION[c]}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{CATEGORY_LABEL[c]}</p>
                <p className="text-muted-foreground">{CATEGORY_DESCRIPTION[c]}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function DistributionBar({ counts, total }: { counts: Record<MatchCategory, number>; total: number }) {
  if (total === 0) {
    return (
      <div className="flex h-2.5 items-center rounded-full bg-muted" role="img" aria-label="No scored opportunities yet" />
    );
  }
  const present = CATEGORIES.filter((c) => counts[c] > 0);
  return (
    <div
      className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full"
      role="img"
      aria-label={present.map((c) => `${CATEGORY_LABEL[c]} ${counts[c]}`).join(", ")}
    >
      {present.map((c, i) => (
        <Tooltip key={c}>
          <TooltipTrigger asChild>
            <motion.div
              className={cn("h-full min-w-1.5 basis-0", CATEGORY_CLASSES[c].dot)}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: counts[c] }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-medium">{CATEGORY_LABEL[c]}</span>{" "}
            <span className="text-muted-foreground tabular">
              {counts[c]} · {Math.round((counts[c] / total) * 100)}%
            </span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ summary tiles

const UTIL_BAR: Record<UtilizationState, string> = {
  low: "bg-primary/60",
  healthy: "bg-primary",
  busy: "bg-primary",
  near: "bg-warning",
  overloaded: "bg-critical",
};

function UtilizationTile({ stats }: { stats: KpiStats }) {
  const u = stats.utilization;
  return (
    <SummaryTile
      icon={<GaugeIcon aria-hidden />}
      label={`Team utilization · ${formatMonth(stats.month, "long")}`}
      value={<AnimatedNumber value={u.percent} />}
      unit="%"
      badge={UTILIZATION_LABEL[u.state]}
      tone={u.state === "overloaded" ? "critical" : u.state === "near" ? "warning" : undefined}
      detail={`${Math.round(u.booked).toLocaleString("en-US")} of ${Math.round(u.capacity).toLocaleString("en-US")} h booked`}
      footer={
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          <motion.div
            className={cn("h-full rounded-full", UTIL_BAR[u.state])}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(100, u.percent)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      }
    />
  );
}

function SummaryTile({
  icon,
  label,
  value,
  unit,
  detail,
  badge,
  tone,
  footer,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  detail: string;
  badge?: string;
  tone?: "warning" | "critical";
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-center gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-4">
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs text-muted-foreground">{label}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl leading-tight font-semibold tracking-tight tabular">
              {value}
              {unit ? <span className="ml-0.5 text-sm font-medium text-muted-foreground">{unit}</span> : null}
            </span>
            {badge ? (
              <span
                className={cn(
                  "text-xs font-medium",
                  tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning" : "text-muted-foreground",
                )}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <span className={cn("truncate text-xs", tone === "critical" && !badge ? "text-critical" : "text-muted-foreground")}>
            {detail}
          </span>
        </div>
      </div>
      {footer}
    </div>
  );
}

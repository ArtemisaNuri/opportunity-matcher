"use client";

import * as React from "react";
import { motion } from "motion/react";
import { LoaderCircleIcon, PlusIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import { useAppState, useAppStore } from "@/lib/store/react";
import { CATEGORIES, type MatchCategory } from "@/lib/domain/types";
import { sortBestMatch } from "@/lib/domain/sort";
import { memberHoursOnDate, safePercent, teamCapacityByMonth, totalDemandByMonth, utilizationState } from "@/lib/capacity";
import { monthKey, todayISO } from "@/lib/dates";
import { PageHeader } from "@/components/shell/page-header";
import { GlowBackdrop } from "@/components/effects/glow-backdrop";
import { BorderBeam } from "@/components/effects/border-beam";
import { EmptyState } from "@/components/effects/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOpportunitySheet } from "@/components/opportunities/opportunity-sheet-context";
import { KpiStrip, type KpiStats } from "@/components/opportunities/kpi-strip";
import { TopMatches } from "@/components/opportunities/top-matches";
import {
  EMPTY_FILTERS,
  OpportunitiesTable,
  filterAndSort,
  type SortState,
  type TableFilters,
} from "@/components/opportunities/opportunities-table";
import { OpportunitiesSkeleton } from "@/components/opportunities/opportunities-skeleton";

export function OpportunitiesView() {
  const hydrated = useAppState((s) => s.hydrated);
  return (
    <>
      <GlowBackdrop />
      <div className="mx-auto w-full max-w-7xl">{hydrated ? <OpportunitiesContent /> : <OpportunitiesSkeleton />}</div>
    </>
  );
}

function Reveal({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function OpportunitiesContent() {
  const store = useAppStore();
  const { openSheet } = useOpportunitySheet();
  const opportunities = useAppState((s) => s.opportunities);
  const members = useAppState((s) => s.members);
  const projects = useAppState((s) => s.projects);
  const settings = useAppState((s) => s.settings);
  const queue = useAppState((s) => s.queue);

  const [filters, setFilters] = React.useState<TableFilters>(EMPTY_FILTERS);
  const [sort, setSort] = React.useState<SortState | null>(null);

  const running = queue.activeId !== null || queue.pending.length > 0;

  const stats = React.useMemo<KpiStats>(() => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<MatchCategory, number>;
    let scoredTotal = 0;
    let unscored = 0;
    let inQueue = 0;
    let pipelineBudget = 0;
    for (const o of opportunities) {
      const cat = o.scoring.result?.category;
      if (cat === "top" || cat === "queued") pipelineBudget += o.clientBudget;
      if (cat) {
        counts[cat] += 1;
        scoredTotal += 1;
      }
      if (o.scoring.status === "unscored") unscored += 1;
      if (o.scoring.status === "queued" || o.scoring.status === "scoring") inQueue += 1;
    }
    const today = todayISO();
    const month = monthKey(today);
    const capacity = teamCapacityByMonth(members, [month])[month] ?? 0;
    const booked = totalDemandByMonth(projects, [month])[month] ?? 0;
    const percent = safePercent(booked, capacity);
    const contracted = members.reduce((s, m) => s + m.weeklyHours, 0);
    const bookedNow = members.reduce((s, m) => s + memberHoursOnDate(m, projects, today), 0);
    return {
      counts,
      scoredTotal,
      total: opportunities.length,
      pipelineBudget,
      month,
      utilization: { percent, booked, capacity, state: utilizationState(percent) },
      openHours: { open: Math.round(contracted - bookedNow), contracted, members: members.length },
      unscored,
      inQueue,
    };
  }, [opportunities, members, projects]);

  const staleCount = React.useMemo(
    () => opportunities.filter((o) => o.scoring.stale && o.scoring.status === "scored").length,
    [opportunities],
  );
  const topMatches = React.useMemo(
    () => sortBestMatch(opportunities.filter((o) => o.scoring.status === "scored" && o.scoring.result?.category === "top")),
    [opportunities],
  );
  const rows = React.useMemo(() => filterAndSort(opportunities, filters, sort), [opportunities, filters, sort]);

  const tableRef = React.useRef<HTMLDivElement>(null);
  const toggleCategory = (c: MatchCategory) =>
    setFilters((f) => ({
      ...f,
      categories: f.categories.length === 1 && f.categories[0] === c ? [] : [c],
    }));
  const showAllTop = () => {
    setFilters((f) => ({ ...f, topOnly: true, categories: [] }));
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scoreAll = (
    <Button
      variant="outline"
      onClick={() => store.scoreAllUnscored()}
      // While a batch runs the button stays lit (it carries the beam); with nothing unscored a click is a no-op.
      disabled={!running && stats.unscored === 0}
      aria-disabled={stats.unscored === 0}
      className={cn("relative overflow-hidden", running && stats.unscored === 0 && "cursor-default active:scale-100")}
      aria-label={running ? "Scoring in progress" : `Score all unscored (${stats.unscored})`}
    >
      {running ? <BorderBeam /> : null}
      {running ? (
        <>
          <LoaderCircleIcon className="animate-spin text-primary" aria-hidden />
          Scoring…
          {stats.unscored > 0 ? <span className="text-muted-foreground tabular">+{stats.unscored}</span> : null}
        </>
      ) : (
        <>
          <SparklesIcon className="text-primary" aria-hidden />
          Score all unscored
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular">
            {stats.unscored}
          </span>
        </>
      )}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <Reveal index={0} className="flex flex-col gap-3">
        <PageHeader
          title="Opportunities"
          description="Incoming work, scored against your team's real capacity."
          actions={
            <>
              {scoreAll}
              <Button onClick={() => openSheet()}>
                <PlusIcon aria-hidden /> New opportunity
              </Button>
            </>
          }
        />
        {staleCount > 0 ? (
          <div
            role="status"
            className="flex animate-fade-in flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-warning/30 bg-warning/[0.07] px-3 py-2 text-sm"
          >
            <RefreshCwIcon className="size-4 shrink-0 text-warning" aria-hidden />
            <p className="min-w-0 flex-1 text-muted-foreground">
              <span className="font-medium text-foreground">
                {staleCount} {staleCount === 1 ? "score is" : "scores are"} out of date.
              </span>{" "}
              Settings or opportunity details changed since they were scored.
            </p>
            <Button size="sm" variant="outline" className="h-7" onClick={() => store.rescoreStale()}>
              <RefreshCwIcon aria-hidden /> Re-score stale
            </Button>
          </div>
        ) : null}
      </Reveal>

      {opportunities.length === 0 ? (
        <Reveal index={1}>
          <div className="rounded-xl border bg-card shadow-xs">
            <EmptyState
              title="No opportunities yet"
              description="Add incoming client work and Smart Scoring will match it against the team's capacity and current projects."
              action={
                <Button onClick={() => openSheet()}>
                  <PlusIcon aria-hidden /> Add your first opportunity
                </Button>
              }
            />
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal index={1}>
            <KpiStrip stats={stats} activeCategories={filters.categories} onToggleCategory={toggleCategory} />
          </Reveal>
          <Reveal index={2}>
            <TopMatches matches={topMatches} onShowAll={showAllTop} />
          </Reveal>
          <Reveal index={3}>
            <div ref={tableRef} className="scroll-mt-20">
              <OpportunitiesTable
                rows={rows}
                total={opportunities.length}
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                settings={settings}
                queue={queue}
                categoryCounts={stats.counts}
              />
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}

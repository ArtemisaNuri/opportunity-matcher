"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AreaChartIcon, GanttChartIcon, InfoIcon, FolderKanbanIcon } from "lucide-react";
import { useAppState, useScoringContext } from "@/lib/store/react";
import { formatMonth } from "@/lib/dates";
import type { Opportunity } from "@/lib/domain/types";
import {
  COMPARISON_SET_LABEL,
  buildComparisonModel,
  comparisonSeries,
  visibleSeries,
  type ComparisonSet,
} from "@/lib/charts/workload";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { WorkloadAreaChart } from "@/components/charts/workload-area-chart";
import { GanttChart, seriesToGanttItems, type GanttItem } from "@/components/charts/gantt-chart";
import { CapacityStatusChip, ChartEmpty, OverloadList } from "@/components/charts/chart-parts";
import { cn } from "@/lib/utils";

type View = "area" | "gantt";
type Mode = "current" | "with";

const SET_SHORT: Record<ComparisonSet, string> = {
  existing: "Existing",
  top: "Top",
  queued: "Queued",
  backup: "Backup",
};

const EMPTY_COPY: Record<Exclude<ComparisonSet, "existing">, string> = {
  top: "No other Top matches yet",
  queued: "No other Queued matches",
  backup: "No Backup matches yet",
};

/** "What happens to capacity if we accept this opportunity?" */
export function ProjectComparisonCard({ opportunity, className }: { opportunity: Opportunity; className?: string }) {
  const ctx = useScoringContext();
  const opportunities = useAppState((s) => s.opportunities);
  const [set, setSet] = React.useState<ComparisonSet>("existing");
  const [view, setView] = React.useState<View>("area");
  const [mode, setMode] = React.useState<Mode>("with");

  const model = React.useMemo(
    () =>
      buildComparisonModel({
        opportunity,
        set,
        members: ctx.members,
        projects: ctx.projects,
        opportunities,
        today: ctx.today,
      }),
    [opportunity, set, ctx, opportunities],
  );

  // Counts per set for the toggle (series in the window, excluding this opportunity).
  const counts = React.useMemo(() => {
    const out = {} as Record<ComparisonSet, number>;
    for (const s of ["existing", "top", "queued", "backup"] as ComparisonSet[]) {
      out[s] = visibleSeries(
        comparisonSeries(s, { projects: ctx.projects, opportunities }, model.months, opportunity.id),
        model.months,
      ).length;
    }
    return out;
  }, [ctx.projects, opportunities, model.months, opportunity.id]);

  const whatIf = set !== "existing";
  const empty = model.series.length === 0;
  const showOpp = mode === "with";
  const rows = showOpp ? model.withOpportunity : model.current;
  const overloads = showOpp ? model.overloadWith : model.overloadCurrent;

  const setNoun = whatIf ? `the other ${COMPARISON_SET_LABEL[set]}` : "existing projects";
  const range = `${formatMonth(model.months[0], "long")} to ${formatMonth(model.months[model.months.length - 1], "long")}`;
  const areaLabel = `Stacked hours per month for ${model.series.length} ${setNoun}${
    showOpp ? ` plus ${opportunity.title}` : ""
  } against team capacity, ${range}. ${
    overloads.length === 0
      ? "Every month is within capacity."
      : `${overloads.length} month${overloads.length === 1 ? "" : "s"} over capacity: ${overloads
          .map((o) => `${formatMonth(o.month, "long")} by ${Math.round(o.overBy)} hours`)
          .join(", ")}.`
  }`;

  const ganttItems: GanttItem[] = React.useMemo(
    () => [
      ...seriesToGanttItems(model.series),
      {
        id: opportunity.id,
        name: opportunity.title,
        client: opportunity.client,
        color: "var(--series-opp)",
        start: model.opportunity.start,
        end: model.opportunity.end,
        milestones: model.opportunity.milestones,
        hoursPerWeek: model.opportunity.hoursPerWeek,
        teamSize: model.opportunity.teamSize,
        variant: "opportunity",
        hoursLabel: `${model.opportunity.hoursPerWeek} h/wk required`,
        barLabel: "This opportunity",
      },
    ],
    [model, opportunity],
  );

  return (
    <Card className={cn("min-w-0 gap-4", className)} data-testid="project-comparison-card">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>Project comparison</CardTitle>
          <CardDescription className="text-xs">
            Monthly hours if this opportunity joins {whatIf ? `the other ${COMPARISON_SET_LABEL[set]}` : "the committed projects"}.
          </CardDescription>
        </div>
        <CapacityStatusChip overloaded={model.overloadWith.length} whatIf={whatIf} />
      </CardHeader>

      <div className="flex flex-col gap-4 px-5 pb-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <div className="flex max-w-full min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">Compare with</span>
            <div className="max-w-full min-w-0 overflow-x-auto">
              <Segmented<ComparisonSet>
                aria-label="Compare with"
                value={set}
                onValueChange={setSet}
                options={(["existing", "top", "queued", "backup"] as ComparisonSet[]).map((s) => ({
                  value: s,
                  label: (
                    <>
                      {SET_SHORT[s]}
                      <span className="tabular text-[10px] text-muted-foreground">{counts[s]}</span>
                    </>
                  ),
                }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">View</span>
            <Segmented<View>
              aria-label="Chart view"
              value={view}
              onValueChange={setView}
              options={[
                { value: "area", label: "Area", icon: <AreaChartIcon aria-hidden /> },
                { value: "gantt", label: "Gantt", icon: <GanttChartIcon aria-hidden /> },
              ]}
            />
          </div>
          {view === "area" ? (
            <Segmented<Mode>
              aria-label="Workload"
              value={mode}
              onValueChange={setMode}
              options={[
                { value: "current", label: "Current workload" },
                { value: "with", label: "With opportunity" },
              ]}
            />
          ) : null}
        </div>

        {whatIf ? (
          <p className="flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
            <InfoIcon aria-hidden className="mt-px size-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">What-if:</span> the other {COMPARISON_SET_LABEL[set]} are treated as
              booked projects at their required hours. Committed projects are not included in this view.
            </span>
          </p>
        ) : null}

        {/* Chart */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${set}-${view}-${view === "area" ? mode : "g"}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex min-w-0 flex-col gap-4"
            data-view={view}
          >
            {empty && whatIf ? (
              <ChartEmpty
                icon={<FolderKanbanIcon aria-hidden />}
                title={EMPTY_COPY[set as Exclude<ComparisonSet, "existing">]}
                description={`Score more opportunities to compare against them. On its own, this opportunity ${
                  model.overloadWith.length === 0 ? "fits the team's capacity" : "exceeds capacity"
                }.`}
                height={view === "area" ? 300 : 160}
              />
            ) : view === "area" ? (
              <>
                <WorkloadAreaChart
                  rows={rows}
                  series={model.series}
                  showOpportunity={showOpp}
                  opportunityLabel="This opportunity"
                  ariaLabel={areaLabel}
                />
                <OverloadList
                  months={overloads}
                  emptyLabel={
                    showOpp
                      ? "Every month stays within team capacity with this opportunity."
                      : "Current workload stays within team capacity."
                  }
                />
              </>
            ) : (
              <GanttChart
                months={model.months}
                items={ganttItems}
                today={ctx.today}
                ariaLabel={`Timeline of ${model.series.length} ${setNoun} and this opportunity, ${range}.`}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}

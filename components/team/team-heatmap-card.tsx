"use client";

import * as React from "react";
import { motion } from "motion/react";
import { TriangleAlertIcon } from "lucide-react";
import { useAppState } from "@/lib/store/react";
import { UTILIZATION_LABEL, UTILIZATION_RANGE, opportunityMonths, type MemberMonthLoad, type UtilizationState } from "@/lib/capacity";
import { formatMonth, monthRange, todayISO, type MonthKey } from "@/lib/dates";
import type { Opportunity } from "@/lib/domain/types";
import { HEAT_VARS } from "@/lib/palette";
import { heatmapRows, heatmapTotals } from "@/lib/charts/team";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MemberAvatar } from "@/components/team/member-avatar";
import { HEAT_TEXT } from "@/components/team/heat";
import { cn } from "@/lib/utils";

export type HeatmapRange = "3" | "6" | "12";

const STATES: UtilizationState[] = ["low", "healthy", "busy", "near", "overloaded"];
const EASE = [0.22, 1, 0.36, 1] as const;

export function TeamHeatmapCard({
  opportunity,
  defaultRange = "6",
  className,
}: {
  opportunity?: Opportunity;
  defaultRange?: HeatmapRange;
  className?: string;
}) {
  const members = useAppState((s) => s.members);
  const projects = useAppState((s) => s.projects);
  const [range, setRange] = React.useState<HeatmapRange>(defaultRange);
  const today = todayISO();

  const months = React.useMemo(() => monthRange(today, Number(range)), [today, range]);
  const rows = React.useMemo(() => heatmapRows(members, projects, months), [members, projects, months]);
  const totals = React.useMemo(() => heatmapTotals(rows, months), [rows, months]);

  const oppMonths = React.useMemo(() => new Set(opportunity ? opportunityMonths(opportunity) : []), [opportunity]);
  const highlighted = months.map((m, i) => (oppMonths.has(m) ? i : -1)).filter((i) => i >= 0);
  const hlStart = highlighted[0];
  const hlEnd = highlighted[highlighted.length - 1];
  const oppOutside = opportunity && oppMonths.size > 0 && highlighted.length === 0;

  // Grid lines: 1 header + members + divider + total.
  const totalRow = rows.length + 3;
  const summary = `Monthly utilization for ${rows.length} people, ${formatMonth(months[0], "long")} to ${formatMonth(
    months[months.length - 1],
    "long",
  )}. Team total peaks at ${Math.max(0, ...totals.map((t) => t.utilization))}%.`;

  return (
    <Card className={cn("min-w-0 gap-4", className)} data-testid="team-heatmap-card">
      <CardHeader className="flex-row flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>Team availability</CardTitle>
          <CardDescription className="text-xs">Monthly utilization per person. Darker is busier.</CardDescription>
        </div>
        <CardAction>
          <Segmented<HeatmapRange>
            aria-label="Heatmap range"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "3", label: "3 mo" },
              { value: "6", label: "6 mo" },
              { value: "12", label: "12 mo" },
            ]}
          />
        </CardAction>
      </CardHeader>

      <div className="min-w-0 px-5">
        <div className="-mx-5 overflow-x-auto overscroll-x-contain px-5 pb-1">
          <div
            role="table"
            aria-label={summary}
            className="relative grid gap-0.5"
            style={{
              gridTemplateColumns: `minmax(8.5rem, 12rem) repeat(${months.length}, minmax(${range === "12" ? "3rem" : "3.5rem"}, 1fr))`,
            }}
          >
            {/* Opportunity window outline */}
            {hlStart != null ? (
              <motion.div
                aria-hidden
                className="pointer-events-none z-[5] -m-[3px] rounded-lg ring-2 ring-primary"
                style={{ gridRow: `1 / ${totalRow + 1}`, gridColumn: `${hlStart + 2} / ${hlEnd + 3}` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                data-opportunity-window
              />
            ) : null}

            {/* Header */}
            <div role="row" className="contents">
              <div
                role="columnheader"
                className="sticky left-0 z-10 flex items-end bg-card pb-1.5 text-[11px] font-medium text-muted-foreground"
                style={{ gridRow: 1, gridColumn: 1 }}
              >
                Member
              </div>
              {months.map((m, i) => {
                const hl = oppMonths.has(m);
                return (
                  <div
                    key={m}
                    role="columnheader"
                    className={cn(
                      "flex h-8 items-end justify-center rounded-t-md pb-1.5 text-[11px] font-medium text-muted-foreground",
                      hl && "bg-primary/10 text-primary",
                    )}
                    style={{ gridRow: 1, gridColumn: i + 2 }}
                  >
                    {i === 0 || m.endsWith("-01") ? formatMonth(m, "shortYear") : formatMonth(m)}
                  </div>
                );
              })}
            </div>

            {/* Members */}
            {rows.map((r, ri) => (
              <div role="row" className="contents" key={r.member.id}>
                <div
                  role="rowheader"
                  className="sticky left-0 z-10 flex min-w-0 items-center gap-2 bg-card pr-3"
                  style={{ gridRow: ri + 2, gridColumn: 1 }}
                >
                  <MemberAvatar name={r.member.name} size="sm" />
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-xs font-medium">{r.member.name}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{r.member.role}</span>
                  </div>
                </div>
                {r.loads.map((l, ci) => (
                  <HeatCell
                    key={l.month}
                    load={l}
                    who={r.member.name}
                    row={ri + 2}
                    col={ci + 2}
                    delay={ci * 0.025 + ri * 0.018}
                    animKey={range}
                  />
                ))}
              </div>
            ))}

            {/* Divider */}
            <div aria-hidden className="my-1 h-px bg-border" style={{ gridRow: rows.length + 2, gridColumn: "1 / -1" }} />

            {/* Team total */}
            <div role="row" className="contents">
              <div
                role="rowheader"
                className="sticky left-0 z-10 flex min-w-0 flex-col justify-center bg-card pr-3 leading-tight"
                style={{ gridRow: totalRow, gridColumn: 1 }}
              >
                <span className="text-xs font-semibold">Team total</span>
                <span className="text-[11px] text-muted-foreground">booked / capacity</span>
              </div>
              {totals.map((l, ci) => (
                <HeatCell
                  key={l.month}
                  load={l}
                  who="Team"
                  row={totalRow}
                  col={ci + 2}
                  delay={ci * 0.025 + rows.length * 0.018}
                  animKey={range}
                  emphasis
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-5 py-3.5 text-xs text-muted-foreground">
        {STATES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn("inline-flex size-3.5 items-center justify-center rounded-[4px] ring-1 ring-foreground/10 ring-inset", HEAT_TEXT[s])}
              style={{ background: HEAT_VARS[s] }}
            >
              {s === "overloaded" ? <TriangleAlertIcon className="size-2.5" /> : null}
            </span>
            <span className="text-foreground/85">{UTILIZATION_LABEL[s]}</span>
            <span className="tabular">{UTILIZATION_RANGE[s]}</span>
          </span>
        ))}
        {opportunity ? (
          <span className="inline-flex items-center gap-1.5 sm:ml-auto">
            <span aria-hidden className="size-3.5 rounded-[4px] ring-2 ring-primary ring-inset" />
            <span className="text-foreground/85">
              {oppOutside ? "Delivery window is outside this range" : "This opportunity’s delivery window"}
            </span>
          </span>
        ) : null}
      </div>
    </Card>
  );
}

function HeatCell({
  load,
  who,
  row,
  col,
  delay,
  animKey,
  emphasis,
}: {
  load: MemberMonthLoad;
  who: string;
  row: number;
  col: number;
  delay: number;
  animKey: string;
  emphasis?: boolean;
}) {
  const over = load.state === "overloaded";
  const label = `${who} · ${formatMonth(load.month as MonthKey, "long")} — ${Math.round(load.booked).toLocaleString("en-US")} / ${Math.round(
    load.capacity,
  ).toLocaleString("en-US")} hours — ${load.utilization}% utilized · ${UTILIZATION_LABEL[load.state]}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          key={animKey}
          role="cell"
          data-heat-state={load.state}
          className={cn(
            "flex h-9 items-center justify-center gap-0.5 rounded-md text-[11px] font-medium tabular ring-foreground/10 ring-inset transition-shadow outline-none hover:ring-2 hover:ring-foreground/40",
            load.state === "low" && "ring-1",
            emphasis && "h-10 font-semibold",
            HEAT_TEXT[load.state],
          )}
          style={{ gridRow: row, gridColumn: col, background: HEAT_VARS[load.state] }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay, ease: EASE }}
        >
          {over ? <TriangleAlertIcon aria-hidden className="size-3" /> : null}
          <span aria-hidden>{load.utilization}%</span>
          <span className="sr-only">{label}</span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="px-2.5 py-1.5">
        <div className="font-semibold">
          {who} · {formatMonth(load.month as MonthKey, "long")}
        </div>
        <div className="tabular text-muted-foreground">
          {Math.round(load.booked).toLocaleString("en-US")} / {Math.round(load.capacity).toLocaleString("en-US")} hours —{" "}
          <span className="text-popover-foreground">{load.utilization}% utilized</span> · {UTILIZATION_LABEL[load.state]}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

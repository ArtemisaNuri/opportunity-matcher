"use client";

import * as React from "react";
import { motion } from "motion/react";
import { formatDate, formatMonth, type ISODate, type MonthKey } from "@/lib/dates";
import type { Milestone } from "@/lib/domain/types";
import { datePosition, ganttSpan, ganttWindow, monthColumns } from "@/lib/charts/gantt";
import type { WorkloadSeries } from "@/lib/charts/workload";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartLegend, type LegendEntry } from "@/components/charts/chart-parts";
import { cn } from "@/lib/utils";

export interface GanttItem {
  id: string;
  name: string;
  client: string;
  color: string;
  start: ISODate;
  /** Exclusive end. */
  end: ISODate;
  launch?: ISODate;
  milestones: Milestone[];
  hoursPerWeek: number;
  teamSize: number;
  /** "opportunity" = the evaluated opportunity (violet, hatched, highlighted row). */
  variant?: "project" | "hypothetical" | "opportunity";
  /** Replaces the default "{h} h/wk" line in the tooltip. */
  hoursLabel?: string;
  /** Text shown on the bar (defaults to the name). */
  barLabel?: string;
}

/** Workload series (projects or hypothetical opportunities) as Gantt rows. */
export function seriesToGanttItems(series: WorkloadSeries[]): GanttItem[] {
  return series.map((s) => ({
    id: s.id,
    name: s.name,
    client: s.client,
    color: s.color,
    start: s.start,
    end: s.end,
    launch: s.launch,
    milestones: s.milestones,
    hoursPerWeek: s.hoursPerWeek,
    teamSize: s.teamSize,
    variant: s.kind === "project" ? "project" : "hypothetical",
    hoursLabel: s.kind === "project" ? `up to ${s.hoursPerWeek} h/wk` : `${s.hoursPerWeek} h/wk required`,
  }));
}

const MONTH_MIN_PX = 42;
const EASE = [0.22, 1, 0.36, 1] as const;

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0]?.contentRect.width ?? 0));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Rough text width for text-xs medium (px). Good enough to decide inside vs outside. */
const estimateText = (s: string) => s.length * 6.4 + 18;

/**
 * Horizontal timeline: one row per item, bars at day precision over a month grid,
 * launch diamonds, milestone ticks and a Today line. Scrolls horizontally on
 * small screens with a sticky label column.
 */
export function GanttChart({
  months,
  items,
  today,
  ariaLabel,
  legend = true,
  className,
}: {
  months: MonthKey[];
  items: GanttItem[];
  today: ISODate;
  ariaLabel: string;
  legend?: boolean;
  className?: string;
}) {
  const w = React.useMemo(() => ganttWindow(months), [months]);
  const cols = React.useMemo(() => monthColumns(w, months), [w, months]);
  const todayPos = datePosition(w, today);
  const [trackRef, trackWidth] = useWidth<HTMLDivElement>();
  const hasLaunch = items.some((i) => i.launch);
  const hasMilestones = items.some((i) => i.milestones.length > 0);
  const hasOpp = items.some((i) => i.variant === "opportunity");

  const legendEntries: LegendEntry[] = [
    ...(hasOpp ? [{ key: "opp", label: "This opportunity", swatch: "hatch" as const }] : []),
    ...(hasLaunch ? [{ key: "launch", label: "Launch", swatch: "diamond" as const }] : []),
    ...(hasMilestones ? [{ key: "ms", label: "Milestone", swatch: "tick" as const }] : []),
    ...(todayPos != null ? [{ key: "today", label: "Today", swatch: "today" as const }] : []),
  ];

  return (
    <div className={cn("@container flex flex-col gap-3", className)}>
      <div
        role="figure"
        aria-label={ariaLabel}
        className="relative overflow-x-auto overscroll-x-contain rounded-lg [--gantt-label:8rem] @3xl:[--gantt-label:12rem]"
      >
        <div
          className="relative"
          style={{ minWidth: `calc(var(--gantt-label) + ${months.length * MONTH_MIN_PX}px)` }}
        >
          {/* Month header */}
          <div className="flex h-9 border-b">
            <div className="sticky left-0 z-30 w-(--gantt-label) shrink-0 bg-card" />
            <div ref={trackRef} className="relative flex-1">
              {cols.map((c, i) => (
                <div
                  key={c.month}
                  className="absolute inset-y-0 flex flex-col justify-center pl-1.5 text-[11px] leading-none font-medium whitespace-nowrap text-muted-foreground"
                  style={{ left: `${c.left}%`, width: `${c.width}%` }}
                >
                  <span>{formatMonth(c.month)}</span>
                  {i === 0 || c.month.endsWith("-01") ? (
                    <span className="mt-0.5 text-[9px] font-normal tabular">{c.month.slice(0, 4)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {/* Grid + today overlay (track area only) */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-(--gantt-label) z-0">
              {cols.slice(1).map((c) => (
                <div key={c.month} className="absolute inset-y-0 border-l border-border/70" style={{ left: `${c.left}%` }} />
              ))}
            </div>
            {items.map((item, i) => (
              <GanttRow key={item.id} item={item} index={i} w={w} trackWidth={trackWidth} />
            ))}
            {todayPos != null ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 left-(--gantt-label) z-20"
              >
                <div className="absolute inset-y-0 border-l border-dashed border-foreground/60" style={{ left: `${todayPos}%` }} />
              </div>
            ) : null}
          </div>

          {/* Today chip sits on the header line */}
          {todayPos != null ? (
            <div aria-hidden className="pointer-events-none absolute top-0 right-0 left-(--gantt-label) z-20 h-9">
              <span
                className="absolute bottom-0 translate-x-[-50%] translate-y-1/2 rounded-full bg-foreground px-1.5 py-px text-[10px] leading-3.5 font-semibold text-background"
                style={{ left: `${todayPos}%` }}
              >
                Today
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {legend && legendEntries.length > 0 ? <ChartLegend entries={legendEntries} /> : null}
    </div>
  );
}

function GanttRow({
  item,
  index,
  w,
  trackWidth,
}: {
  item: GanttItem;
  index: number;
  w: ReturnType<typeof ganttWindow>;
  trackWidth: number;
}) {
  const isOpp = item.variant === "opportunity";
  const span = ganttSpan(w, item.start, item.end);
  const text = item.barLabel ?? item.name;
  const barPx = span ? (span.width / 100) * trackWidth : 0;
  const textPx = estimateText(text) + (isOpp ? 16 : 0);
  const fits = trackWidth === 0 ? span != null && span.width > 22 : barPx >= textPx;
  const rightRoom = span ? ((100 - span.left - span.width) / 100) * trackWidth : 0;
  const outside: "right" | "left" = rightRoom >= textPx + 8 || trackWidth === 0 ? "right" : "left";
  const launchPos = item.launch ? datePosition(w, item.launch) : null;
  const ticks = item.milestones
    .filter((m) => m.date !== item.launch)
    .map((m) => ({ ...m, pos: datePosition(w, m.date) }))
    .filter((m): m is Milestone & { pos: number } => m.pos != null);
  const delay = 0.05 + index * 0.05;

  const rowTint = isOpp ? "bg-[color-mix(in_oklab,var(--primary)_7%,var(--card))]" : "bg-card";

  return (
    <div className={cn("relative flex h-12 border-b border-border/60 last:border-b-0", isOpp && "border-t border-primary/25")}>
      <div
        className={cn(
          "sticky left-0 z-30 flex w-(--gantt-label) shrink-0 items-center gap-2 border-r border-border/60 pr-2 pl-1",
          rowTint,
        )}
      >
        {isOpp ? (
          <span aria-hidden className="hatch-opp h-6 w-1 shrink-0 rounded-full" />
        ) : (
          <span aria-hidden className="h-6 w-1 shrink-0 rounded-full" style={{ background: item.color }} />
        )}
        <div className="flex min-w-0 flex-col">
          <span className={cn("truncate text-xs font-medium", isOpp && "font-semibold")}>{item.name}</span>
          <span className={cn("truncate text-[11px] text-muted-foreground", isOpp && "font-medium text-primary")}>
            {isOpp ? "This opportunity" : item.client}
          </span>
        </div>
      </div>
      <div className={cn("relative z-10 flex-1", isOpp && "bg-primary/[0.04]")}>
        {span ? (
          <>
            <motion.div
              className="absolute top-1/2 h-7 -translate-y-1/2"
              style={{ left: `${span.left}%`, width: `${span.width}%`, originX: 0 }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.55, delay, ease: EASE }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-gantt-bar={item.id}
                    aria-label={`${item.name}, ${formatDate(item.start)} to ${formatDate(item.end)}`}
                    className={cn(
                      "relative flex size-full cursor-default items-center overflow-hidden rounded-md px-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                      span.clippedStart && "rounded-l-none",
                      span.clippedEnd && "rounded-r-none",
                      isOpp && "hatch-opp ring-[1.5px] ring-series-opp ring-inset",
                    )}
                    style={
                      isOpp
                        ? undefined
                        : {
                            background: `color-mix(in oklab, ${item.color} 22%, var(--card))`,
                            boxShadow: `inset 3px 0 0 ${item.color}, inset 0 0 0 1px color-mix(in oklab, ${item.color} 45%, transparent)`,
                          }
                    }
                  >
                    {fits ? (
                      <span
                        className={cn(
                          "truncate text-xs font-medium text-foreground",
                          isOpp && "rounded bg-card/90 px-1.5 py-px font-semibold",
                        )}
                      >
                        {text}
                      </span>
                    ) : (
                      <span className="sr-only">{text}</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 px-3 py-2">
                  <GanttTooltipBody item={item} />
                </TooltipContent>
              </Tooltip>
            </motion.div>

            {!fits ? (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 truncate text-xs font-medium whitespace-nowrap text-foreground"
                style={
                  outside === "right"
                    ? { left: `calc(${span.left + span.width}% + ${launchPos != null ? 12 : 6}px)` }
                    : { right: `calc(${100 - span.left}% + 6px)` }
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.35 }}
              >
                {text}
              </motion.span>
            ) : null}

            {ticks.map((m) => (
              <motion.span
                key={`${m.label}-${m.date}`}
                aria-hidden
                title={`${m.label} · ${formatDate(m.date)}`}
                className="absolute top-[calc(50%+8px)] z-10 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60 ring-1 ring-card"
                style={{ left: `${m.pos}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: delay + 0.4 }}
              />
            ))}

            {launchPos != null ? (
              <motion.span
                aria-hidden
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] ring-2 ring-card"
                style={{ left: `${launchPos}%`, background: "var(--foreground)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: delay + 0.45 }}
              />
            ) : null}
          </>
        ) : (
          <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[11px] text-muted-foreground">Outside this window</span>
        )}
      </div>
    </div>
  );
}

function GanttTooltipBody({ item }: { item: GanttItem }) {
  const isOpp = item.variant === "opportunity";
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <div className="flex items-center gap-2">
        {isOpp ? (
          <span aria-hidden className="hatch-opp size-2.5 rounded-[3px] ring-1 ring-series-opp ring-inset" />
        ) : (
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
        )}
        <span className="font-semibold">{item.name}</span>
      </div>
      <div className="text-muted-foreground">{item.client}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt className="text-muted-foreground">{isOpp || item.variant === "hypothetical" ? "Delivery" : "Timeline"}</dt>
        <dd className="tabular">
          {formatDate(item.start, false)} → {formatDate(item.end)}
        </dd>
        {item.launch ? (
          <>
            <dt className="text-muted-foreground">Launch</dt>
            <dd className="tabular">{formatDate(item.launch)}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">Load</dt>
        <dd className="tabular">{item.hoursLabel ?? `${item.hoursPerWeek} h/wk`}</dd>
        <dt className="text-muted-foreground">Team</dt>
        <dd className="tabular">
          {item.teamSize} {item.teamSize === 1 ? "person" : "people"}
        </dd>
      </dl>
      {item.milestones.length > 0 ? (
        <ul className="flex flex-col gap-0.5 border-t pt-1.5">
          {item.milestones.map((m) => (
            <li key={`${m.label}-${m.date}`} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="tabular">{formatDate(m.date, false)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

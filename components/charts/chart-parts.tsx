"use client";

import * as React from "react";
import { CheckCircle2Icon, TriangleAlertIcon } from "lucide-react";
import { formatMonth } from "@/lib/dates";
import type { OverloadedMonth } from "@/lib/charts/workload";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ legend

export type LegendSwatch = "fill" | "hatch" | "dashed-line" | "diamond" | "tick" | "today";

export interface LegendEntry {
  key: string;
  label: React.ReactNode;
  color?: string;
  swatch?: LegendSwatch;
}

export function LegendSwatchMark({ swatch = "fill", color }: { swatch?: LegendSwatch; color?: string }) {
  switch (swatch) {
    case "hatch":
      return <span aria-hidden className="hatch-opp size-3 shrink-0 rounded-[3px] ring-1 ring-series-opp ring-inset" />;
    case "dashed-line":
      return (
        <span aria-hidden className="flex h-3 w-4 shrink-0 items-center">
          <span className="w-full border-t-2 border-dashed" style={{ borderColor: color }} />
        </span>
      );
    case "diamond":
      return (
        <span aria-hidden className="flex size-3 shrink-0 items-center justify-center">
          <span className="size-2 rotate-45 rounded-[1px] bg-foreground/70" />
        </span>
      );
    case "tick":
      return (
        <span aria-hidden className="flex size-3 shrink-0 items-center justify-center">
          <span className="h-3 w-0.5 rounded-full bg-foreground/50" />
        </span>
      );
    case "today":
      return (
        <span aria-hidden className="flex size-3 shrink-0 items-center justify-center">
          <span className="h-3 border-l border-dashed border-foreground/70" />
        </span>
      );
    default:
      return <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: color }} />;
  }
}

/** HTML legend that wraps. Text uses text tokens; the swatch carries identity. */
export function ChartLegend({ entries, className }: { entries: LegendEntry[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {entries.map((e) => (
        <li key={e.key} className="flex min-w-0 items-center gap-1.5">
          <LegendSwatchMark swatch={e.swatch} color={e.color} />
          <span className="truncate">{e.label}</span>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ overload chips

/** Overloaded months as chips ("Oct 2026 · +84 h over"), or a calm all-clear line. */
export function OverloadList({
  months,
  emptyLabel = "Every month stays within team capacity.",
  className,
}: {
  months: OverloadedMonth[];
  emptyLabel?: string;
  className?: string;
}) {
  if (months.length === 0) {
    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <CheckCircle2Icon aria-hidden className="size-3.5 text-good" />
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="mr-1 text-xs font-medium text-muted-foreground">Over capacity</span>
      {months.map((m) => (
        <span
          key={m.month}
          data-overload-month={m.month}
          className="inline-flex h-6 items-center gap-1 rounded-md bg-cat-bad-soft px-2 text-xs font-medium text-foreground ring-1 ring-critical/25 ring-inset"
        >
          <TriangleAlertIcon aria-hidden className="size-3 text-critical" />
          {formatMonth(m.month, "long")}
          <span className="text-muted-foreground">·</span>
          <span className="tabular">+{Math.round(m.overBy).toLocaleString("en-US")} h over</span>
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ status chip

export function CapacityStatusChip({ overloaded, whatIf, className }: { overloaded: number; whatIf?: boolean; className?: string }) {
  const over = overloaded > 0;
  return (
    <span
      data-capacity-status={over ? "over" : "fits"}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-foreground ring-1 ring-inset",
        over ? "bg-cat-bad-soft ring-critical/25" : "bg-good/10 ring-good/25",
        className,
      )}
    >
      {over ? (
        <TriangleAlertIcon aria-hidden className="size-3.5 text-critical" />
      ) : (
        <CheckCircle2Icon aria-hidden className="size-3.5 text-good" />
      )}
      {whatIf ? <span className="text-muted-foreground">What-if:</span> : null}
      <span className="tabular">
        {over ? `${overloaded} month${overloaded === 1 ? "" : "s"} over capacity` : "Fits capacity"}
      </span>
    </span>
  );
}

// ------------------------------------------------------------------ chart empty state

export function ChartEmpty({
  icon,
  title,
  description,
  height = 280,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-6 text-center",
        className,
      )}
      style={{ minHeight: height }}
    >
      {icon ? <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-sm text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

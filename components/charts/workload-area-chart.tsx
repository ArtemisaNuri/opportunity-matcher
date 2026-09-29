"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TriangleAlertIcon } from "lucide-react";
import { UTILIZATION_LABEL, utilizationState } from "@/lib/capacity";
import { formatMonth } from "@/lib/dates";
import { AXIS_COLOR, CAPACITY_LINE_COLOR, GRID_COLOR, OPPORTUNITY_COLOR } from "@/lib/palette";
import type { WorkloadRow, WorkloadSeries } from "@/lib/charts/workload";
import { ChartLegend, LegendSwatchMark, type LegendEntry } from "@/components/charts/chart-parts";
import { cn } from "@/lib/utils";

const nf = (n: number) => Math.round(n).toLocaleString("en-US");

/** A nice rounded y-axis maximum above both the stack and the capacity line. */
function niceMax(rows: WorkloadRow[]): number {
  const peak = rows.reduce((m, r) => Math.max(m, r.total, r.capacity), 0);
  if (peak <= 0) return 100;
  const padded = peak * 1.08;
  const step = padded > 2000 ? 500 : padded > 800 ? 200 : 100;
  return Math.ceil(padded / step) * step;
}

function tickLabel(rows: WorkloadRow[], i: number): string {
  const row = rows[Math.round(i)];
  if (!row) return "";
  return Math.round(i) === 0 || row.month.endsWith("-01") ? formatMonth(row.month, "shortYear") : formatMonth(row.month);
}

export interface WorkloadAreaChartProps {
  rows: WorkloadRow[];
  series: WorkloadSeries[];
  /** Stack the evaluated opportunity on top (violet, hatched). */
  showOpportunity?: boolean;
  opportunityLabel?: string;
  height?: number;
  ariaLabel: string;
  /** Show the HTML legend under the chart (default true). */
  legend?: boolean;
  className?: string;
}

/**
 * Stacked monthly hours per series against the team capacity line. Months where
 * the stack exceeds capacity are shaded in the critical tone.
 */
export function WorkloadAreaChart({
  rows,
  series,
  showOpportunity = false,
  opportunityLabel = "This opportunity",
  height = 280,
  ariaLabel,
  legend = true,
  className,
}: WorkloadAreaChartProps) {
  const rawId = React.useId();
  const hatchId = `opp-hatch-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const last = rows.length - 1;
  const yMax = niceMax(rows);

  const data = rows;

  const overloaded = rows.filter((r) => r.overloaded);

  const legendEntries: LegendEntry[] = [
    ...series.map((s) => ({ key: s.id, label: s.name, color: s.color })),
    ...(showOpportunity ? [{ key: "opp", label: opportunityLabel, swatch: "hatch" as const }] : []),
    { key: "capacity", label: "Team capacity", color: CAPACITY_LINE_COLOR, swatch: "dashed-line" as const },
    ...(overloaded.length > 0
      ? [{ key: "over", label: "Over capacity", color: "color-mix(in oklab, var(--critical) 22%, transparent)" }]
      : []),
  ];

  return (
    <div className={cn("relative flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Hours / month</span>
      </div>
      <div role="img" aria-label={ariaLabel} className="-ml-1" style={{ height }}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <rect width="6" height="6" fill={OPPORTUNITY_COLOR} fillOpacity={0.16} />
                <line x1="0" y1="0" x2="0" y2="6" stroke={OPPORTUNITY_COLOR} strokeWidth="2.5" strokeOpacity={0.85} />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_COLOR} />
            {overloaded.map((r) => (
              <ReferenceArea
                key={r.month}
                x1={Math.max(0, r.index - 0.5)}
                x2={Math.min(last, r.index + 0.5)}
                y1={0}
                y2={yMax}
                fill="var(--critical)"
                fillOpacity={0.1}
                stroke="none"
                ifOverflow="hidden"
              />
            ))}
            <XAxis
              dataKey="index"
              type="number"
              domain={[0, Math.max(1, last)]}
              ticks={rows.map((r) => r.index)}
              tickFormatter={(i: number) => tickLabel(rows, i)}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={8}
              padding={{ left: 6, right: 6 }}
            />
            <YAxis
              domain={[0, yMax]}
              allowDataOverflow={false}
              tickFormatter={(v: number) => nf(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              width={48}
              tickCount={5}
            />
            <Tooltip
              cursor={{ stroke: AXIS_COLOR, strokeWidth: 1, strokeDasharray: "3 3" }}
              content={<WorkloadTooltip series={series} showOpportunity={showOpportunity} opportunityLabel={opportunityLabel} />}
              isAnimationActive={false}
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stackId="load"
                fill={s.color}
                fillOpacity={0.85}
                stroke="var(--card)"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={600}
                animationEasing="ease-out"
              />
            ))}
            {showOpportunity ? (
              <Area
                key="opportunity"
                type="monotone"
                dataKey="opportunity"
                name={opportunityLabel}
                stackId="load"
                fill={`url(#${hatchId})`}
                fillOpacity={1}
                stroke="none"
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={600}
                animationEasing="ease-out"
              />
            ) : null}
            <Line
              type="linear"
              dataKey="capacity"
              name="Team capacity"
              stroke={CAPACITY_LINE_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive
              animationDuration={600}
              label={(p: { x?: number; y?: number; index?: number }) =>
                p.index === last && p.x != null && p.y != null ? (
                  <text
                    key="capacity-label"
                    x={p.x - 2}
                    y={p.y - 8}
                    textAnchor="end"
                    fontSize={11}
                    fontWeight={500}
                    fill="var(--muted-foreground)"
                  >
                    Capacity
                  </text>
                ) : (
                  <g key={`capacity-label-${p.index}`} />
                )
              }
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {legend ? <ChartLegend entries={legendEntries} /> : null}
      <WorkloadDataTable rows={rows} series={series} showOpportunity={showOpportunity} opportunityLabel={opportunityLabel} />
    </div>
  );
}

// ------------------------------------------------------------------ tooltip

interface TooltipContentProps {
  active?: boolean;
  payload?: { payload?: WorkloadRow }[];
  series: WorkloadSeries[];
  showOpportunity: boolean;
  opportunityLabel: string;
}

function WorkloadTooltip({ active, payload, series, showOpportunity, opportunityLabel }: TooltipContentProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const items = [...series].reverse().filter((s) => Number(row[s.key] ?? 0) > 0);
  const state = utilizationState(row.utilization);
  return (
    <div className="min-w-56 rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-lg">
      <div className="mb-2 font-semibold">{formatMonth(row.month, "long")}</div>
      <ul className="flex flex-col gap-1">
        {showOpportunity && row.opportunity > 0 ? (
          <li className="flex items-center gap-2">
            <LegendSwatchMark swatch="hatch" />
            <span className="min-w-0 flex-1 truncate font-medium">{opportunityLabel}</span>
            <span className="tabular">{nf(row.opportunity)} h</span>
          </li>
        ) : null}
        {items.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <LegendSwatchMark color={s.color} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.name}</span>
            <span className="tabular">{nf(Number(row[s.key]))} h</span>
          </li>
        ))}
        {items.length === 0 && !(showOpportunity && row.opportunity > 0) ? (
          <li className="text-muted-foreground">Nothing booked</li>
        ) : null}
      </ul>
      <div className="mt-2 flex flex-col gap-1 border-t pt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Total / capacity</span>
          <span className="tabular font-medium">
            {nf(row.total)} / {nf(row.capacity)} h
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Utilization</span>
          <span className="tabular font-medium">
            {row.utilization}% · {UTILIZATION_LABEL[state]}
          </span>
        </div>
        {row.overloaded ? (
          <div className="mt-1 flex items-center gap-1.5 rounded-md bg-cat-bad-soft px-2 py-1 font-medium">
            <TriangleAlertIcon aria-hidden className="size-3.5 text-critical" />
            <span className="tabular">Over capacity by {nf(row.overBy)} h</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ screen-reader table

function WorkloadDataTable({
  rows,
  series,
  showOpportunity,
  opportunityLabel,
}: {
  rows: WorkloadRow[];
  series: WorkloadSeries[];
  showOpportunity: boolean;
  opportunityLabel: string;
}) {
  return (
    <div className="sr-only">
    <table>
      <caption>Hours per month by series, with team capacity</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.name}
            </th>
          ))}
          {showOpportunity ? <th scope="col">{opportunityLabel}</th> : null}
          <th scope="col">Total</th>
          <th scope="col">Capacity</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.month}>
            <th scope="row">{formatMonth(r.month, "long")}</th>
            {series.map((s) => (
              <td key={s.key}>{nf(Number(r[s.key] ?? 0))} h</td>
            ))}
            {showOpportunity ? <td>{nf(r.opportunity)} h</td> : null}
            <td>{nf(r.total)} h</td>
            <td>{nf(r.capacity)} h</td>
            <td>{r.overloaded ? `Over by ${nf(r.overBy)} h` : "Within capacity"}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

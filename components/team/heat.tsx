import * as React from "react";
import { TriangleAlertIcon } from "lucide-react";
import { UTILIZATION_LABEL, type UtilizationState } from "@/lib/capacity";
import { HEAT_VARS } from "@/lib/palette";
import { cn } from "@/lib/utils";

/**
 * Text color on a heat cell, per state and theme, for contrast. Light: light
 * text on busy/near/over. Dark: the ramp brightens as it gets busier, so the
 * "near" step (a light violet) takes dark text.
 */
export const HEAT_TEXT: Record<UtilizationState, string> = {
  low: "text-foreground/80",
  healthy: "text-foreground dark:text-white",
  busy: "text-white",
  near: "text-white dark:text-background",
  overloaded: "text-white",
};

/** Small utilization bar (heat color) + % + state label. */
export function UtilizationBar({
  percent,
  state,
  showLabel = true,
  className,
}: {
  percent: number;
  state: UtilizationState;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div
        className="relative h-1.5 w-14 shrink-0 sm:w-16 xl:w-20 overflow-hidden rounded-full bg-muted ring-1 ring-border/60 ring-inset"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, percent)}
        aria-label={`${percent}% utilized, ${UTILIZATION_LABEL[state]}`}
      >
        <div
          className="h-full rounded-full ring-1 ring-foreground/10 ring-inset transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%`, background: HEAT_VARS[state] }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular">{percent}%</span>
      {showLabel ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 truncate text-xs text-muted-foreground",
            state === "overloaded" && "font-medium text-foreground",
          )}
        >
          {state === "overloaded" ? <TriangleAlertIcon aria-hidden className="size-3 text-critical" /> : null}
          {UTILIZATION_LABEL[state]}
        </span>
      ) : null}
    </div>
  );
}

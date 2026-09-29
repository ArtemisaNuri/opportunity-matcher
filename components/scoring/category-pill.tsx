import * as React from "react";
import { CircleDashedIcon, ClockIcon, LoaderCircleIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { CATEGORY_LABEL, type MatchCategory, type Opportunity } from "@/lib/domain/types";
import { CATEGORY_CLASSES } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function CategoryPill({
  category,
  size = "sm",
  className,
}: {
  category: MatchCategory;
  size?: "sm" | "md";
  className?: string;
}) {
  const c = CATEGORY_CLASSES[category];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        c.bg,
        c.text,
        c.ring,
        size === "sm" ? "h-6 px-2.5 text-xs" : "h-8 px-3.5 text-sm",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} aria-hidden />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

/** Pill for the opportunity's scoring lifecycle state (unscored / queued / scoring / error), or its category. */
export function ScoringStatePill({ opportunity, className }: { opportunity: Opportunity; className?: string }) {
  const { status, result, stale } = opportunity.scoring;
  if (status === "scored" && result) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <CategoryPill category={result.category} />
        {stale ? (
          <span title="Inputs changed since this score" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCwIcon className="size-3" /> Stale
          </span>
        ) : null}
      </span>
    );
  }
  const base = "inline-flex h-6 w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium";
  if (status === "queued")
    return (
      <span className={cn(base, "animate-pulse-soft bg-accent text-accent-foreground", className)}>
        <ClockIcon className="size-3" /> Queued
      </span>
    );
  if (status === "scoring")
    return (
      <span className={cn(base, "bg-primary/10 text-primary", className)}>
        <LoaderCircleIcon className="size-3 animate-spin" /> <span className="text-shimmer">Analyzing</span>
      </span>
    );
  if (status === "error")
    return (
      <span className={cn(base, "bg-cat-bad-soft text-cat-bad", className)}>
        <TriangleAlertIcon className="size-3" /> Failed
      </span>
    );
  return (
    <span className={cn(base, "border border-dashed text-muted-foreground", className)}>
      <CircleDashedIcon className="size-3" /> Unscored
    </span>
  );
}

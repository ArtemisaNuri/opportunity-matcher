import * as React from "react";
import {
  CalendarClockIcon,
  LayersIcon,
  ScaleIcon,
  TargetIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import type { FactorKey, Opportunity } from "@/lib/domain/types";
import type { OpportunityInput } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

export const FACTOR_ICON: Record<FactorKey, LucideIcon> = {
  capacity: UsersIcon,
  budget: WalletIcon,
  timeline: CalendarClockIcon,
  profile: TargetIcon,
  stage: LayersIcon,
  size: ScaleIcon,
};

/** Factor labels and what each measures (reference copy; the engine owns the numbers). */
export const FACTOR_INFO: { key: FactorKey; label: string; measures: string }[] = [
  { key: "capacity", label: "Team capacity", measures: "Share of delivery months the team can absorb, minus staffing gaps" },
  { key: "budget", label: "Budget vs. cost", measures: "Client budget band, −5 when it's below the cost to build" },
  { key: "timeline", label: "Timeline fit", measures: "Weeks available before the deadline and launch clashes during ramp-up" },
  { key: "profile", label: "Project profile fit", measures: "Profile tags that match your focus areas" },
  { key: "stage", label: "Stage fit", measures: "Points for Full Build, Prototype or Recovery work" },
  { key: "size", label: "Project size", measures: "Effort relative to the team's monthly throughput" },
];

/** Points with at most one decimal: 12 → "12", 7.5 → "7.5". */
export function fmtPts(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Strips the stored-only fields so an opportunity can be passed back to `updateOpportunity`. */
export function toOpportunityInput(opp: Opportunity): OpportunityInput {
  const { id: _id, createdAt: _createdAt, source: _source, scoring: _scoring, ...input } = opp;
  return input;
}

/** Small uppercase section label used inside dense cards. */
export function SectionLabel({
  as: Tag = "h3",
  icon: Icon,
  children,
  className,
}: {
  as?: "h3" | "h4" | "p";
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase",
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      {children}
    </Tag>
  );
}

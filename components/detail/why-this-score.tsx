"use client";

import * as React from "react";
import {
  CalendarIcon,
  LightbulbIcon,
  ListChecksIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";
import type { Opportunity, ScoreResult, Settings } from "@/lib/domain/types";
import { FactorBars } from "@/components/detail/factor-bars";
import { CapacityConflicts } from "@/components/detail/capacity-conflicts";
import { Improvements } from "@/components/detail/improvements";
import { SectionLabel } from "@/components/detail/shared";
import { cn } from "@/lib/utils";

/** The transparency panel: sub-scores, capacity conflicts, major +/− factors, and what would improve it. */
export function WhyThisScore({
  opportunity,
  result,
  settings,
}: {
  opportunity: Opportunity;
  result: ScoreResult;
  settings: Settings;
}) {
  return (
    <section aria-labelledby="why-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="why-heading" className="text-base font-semibold">
          Why this score?
        </h3>
        <p className="text-xs text-muted-foreground">Every point below comes from a fixed rule. Nothing is estimated.</p>
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <Block icon={ScaleIcon} title="Factor breakdown" className="lg:order-1 lg:col-span-7">
          <FactorBars factors={result.factors} rawTotal={result.rawTotal} total={result.total} />
        </Block>
        <Block
          icon={CalendarIcon}
          title="Capacity conflicts"
          aside={result.conflicts.length > 0 ? `${result.conflicts.length} of ${result.capacityGate.months.length} months` : undefined}
          className="lg:order-3 lg:col-span-7"
        >
          <CapacityConflicts conflicts={result.conflicts} monthCount={result.capacityGate.months.length} />
        </Block>
        <Block icon={ListChecksIcon} title="Major factors" className="lg:order-2 lg:col-span-5">
          <MajorFactors positives={result.positives} negatives={result.negatives} />
        </Block>
        <Block icon={LightbulbIcon} title="What would improve it" className="lg:order-4 lg:col-span-5">
          <Improvements opportunity={opportunity} result={result} settings={settings} />
        </Block>
      </div>
    </section>
  );
}

function Block({
  icon,
  title,
  aside,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  aside?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <SectionLabel as="h4" icon={icon}>
          {title}
        </SectionLabel>
        {aside ? <span className="text-xs font-medium text-critical tabular">{aside}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** Splits "Label: note" strings from the engine so the label can be emphasised. */
function splitFactor(s: string): [string, string] {
  const i = s.indexOf(": ");
  return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : ["", s];
}

function MajorFactors({ positives, negatives }: { positives: string[]; negatives: string[] }) {
  const cols = [
    { title: "Working for it", items: positives, Icon: TrendingUpIcon, tone: "text-good", empty: "No factor is strongly in its favour." },
    { title: "Working against it", items: negatives, Icon: TrendingDownIcon, tone: "text-critical", empty: "Nothing is strongly against it." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {cols.map(({ title, items, Icon, tone, empty }) => (
        <div key={title} className="flex flex-col gap-2">
          <p className={cn("flex items-center gap-1.5 text-sm font-medium", tone)}>
            <Icon className="size-4" aria-hidden />
            {title}
            <span className="text-xs font-normal text-muted-foreground tabular">({items.length})</span>
          </p>
          {items.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const [label, note] = splitFactor(item);
                return (
                  <li key={item} className="flex gap-2 text-sm leading-snug">
                    <span aria-hidden className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tone === "text-good" ? "bg-good" : "bg-critical")} />
                    <span className="text-pretty">
                      {label ? <span className="font-medium">{label}: </span> : null}
                      <span className="text-muted-foreground">{note}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </div>
      ))}
    </div>
  );
}

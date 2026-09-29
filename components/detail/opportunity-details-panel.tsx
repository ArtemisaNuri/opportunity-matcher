"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  CalendarIcon,
  CheckIcon,
  FlagIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
  UsersIcon,
  WalletIcon,
  FileTextIcon,
} from "lucide-react";
import type { Opportunity, Settings } from "@/lib/domain/types";
import { isRestrictedSector } from "@/lib/scoring/engine";
import { opportunityWindow } from "@/lib/capacity";
import { addDays, diffDays, formatDate, type ISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionLabel, plural } from "@/components/detail/shared";
import { cn } from "@/lib/utils";

export function OpportunityDetailsPanel({
  opportunity,
  settings,
  className,
}: {
  opportunity: Opportunity;
  settings: Settings;
  className?: string;
}) {
  const restricted = isRestrictedSector(opportunity.sector, settings.restrictedSectors);
  return (
    <Card className={cn("gap-0", className)} aria-labelledby="details-heading">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <h2 id="details-heading" className="text-base font-semibold">
          Opportunity details
        </h2>
        <span className="text-xs text-muted-foreground">From the client</span>
      </div>
      {restricted ? <RestrictedCallout sector={opportunity.sector} /> : null}
      <div className="flex flex-col">
        <ProfileSection opportunity={opportunity} preferredTags={settings.preferredTags} />
        <Separator />
        <BudgetSection opportunity={opportunity} minBudget={settings.minBudget} />
        <Separator />
        <TimelineSection opportunity={opportunity} />
        <Separator />
        <CapacitySection opportunity={opportunity} />
      </div>
    </Card>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="flex flex-col gap-3 px-5 py-4 last:pb-5">{children}</section>;
}

// ---------------------------------------------------------------- restricted

function RestrictedCallout({ sector }: { sector: string }) {
  return (
    <div
      role="note"
      className="mx-5 mb-4 flex gap-3 rounded-lg border border-cat-bad/30 bg-cat-bad-soft px-3.5 py-3 text-sm text-cat-bad"
    >
      <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">Restricted sector: {sector}</p>
        <p className="text-foreground/80">
          Opportunities in {sector} are always a Bad Match, whatever their score. Change this in Settings.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- profile

function ProfileSection({ opportunity, preferredTags }: { opportunity: Opportunity; preferredTags: string[] }) {
  const preferred = React.useMemo(() => new Set(preferredTags.map((t) => t.trim().toLowerCase())), [preferredTags]);
  const matched = opportunity.profileTags.filter((t) => preferred.has(t.trim().toLowerCase())).length;
  return (
    <Section>
      <SectionLabel icon={FileTextIcon}>Profile</SectionLabel>
      <p className="text-sm leading-relaxed text-pretty text-foreground/90">
        {opportunity.profile || <span className="text-muted-foreground">No description yet.</span>}
      </p>
      {opportunity.profileTags.length > 0 ? (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-1.5" aria-label="Profile tags">
            {opportunity.profileTags.map((tag) => {
              const focus = preferred.has(tag.trim().toLowerCase());
              return (
                <li
                  key={tag}
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium",
                    focus
                      ? "bg-primary/10 text-primary ring-1 ring-primary/25 ring-inset"
                      : "border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {focus ? <CheckIcon className="size-3" aria-hidden /> : null}
                  {tag}
                  {focus ? <span className="sr-only"> (focus area)</span> : null}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            {matched > 0
              ? `${matched} of ${opportunity.profileTags.length} tags match your focus areas`
              : "No tags match your focus areas"}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No profile tags.</p>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- budget

function BudgetSection({ opportunity, minBudget }: { opportunity: Opportunity; minBudget: number }) {
  const { clientBudget: budget, costToBuild: cost } = opportunity;
  const scale = Math.max(budget, cost, 1);
  const margin = budget - cost;
  const marginPct = budget > 0 ? Math.round((margin / budget) * 100) : 0;
  const short = margin < 0;
  const underMin = budget < minBudget;

  const rows = [
    { label: "Client budget", value: budget, bar: short ? "bg-critical" : "bg-primary" },
    { label: "Cost to build", value: cost, bar: "bg-muted-foreground/45" },
  ];

  return (
    <Section>
      <SectionLabel icon={WalletIcon}>Budget vs cost</SectionLabel>
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={r.label} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <motion.div
                className={cn("h-full rounded-full", r.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${(r.value / scale) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-right font-medium tabular">{formatMoney(r.value)}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium tabular",
            short ? "bg-critical/10 text-critical" : "bg-good/10 text-good",
          )}
        >
          {short ? <TriangleAlertIcon className="size-3" aria-hidden /> : null}
          {short
            ? `${formatMoney(-margin)} short of the cost to build`
            : `${formatMoney(margin)} margin (${marginPct}%)`}
        </span>
        {underMin ? (
          <span className="inline-flex items-center gap-1 text-warning">
            <TriangleAlertIcon className="size-3" aria-hidden />
            Under the {formatMoney(minBudget, { compact: true })} minimum budget
          </span>
        ) : null}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- timeline

type TimelineKind = "start" | "milestone" | "end" | "deadline";

function TimelineSection({ opportunity }: { opportunity: Opportunity }) {
  const { requirements: req, deadline, milestones } = opportunity;
  const { start, end } = opportunityWindow(opportunity);
  // The window is half-open; the last working day is the day before `end`.
  const lastDay = addDays(end, -1);
  const slackWeeks = deadline ? diffDays(lastDay, deadline) / 7 : undefined;

  const events = React.useMemo(() => {
    const list: { date: ISODate; label: string; kind: TimelineKind }[] = [
      { date: start, label: "Preferred start", kind: "start" },
      ...milestones.map((m) => ({ date: m.date, label: m.label, kind: "milestone" as const })),
      { date: lastDay, label: "Projected end", kind: "end" },
    ];
    if (deadline) list.push({ date: deadline, label: "Deadline", kind: "deadline" });
    const order: Record<TimelineKind, number> = { start: 0, milestone: 1, end: 2, deadline: 3 };
    return list.sort((a, b) => (a.date === b.date ? order[a.kind] - order[b.kind] : a.date < b.date ? -1 : 1));
  }, [start, lastDay, deadline, milestones]);

  let deadlineNote: React.ReactNode = <span className="text-muted-foreground">No hard deadline</span>;
  if (slackWeeks !== undefined && deadline) {
    const w = Math.round(slackWeeks * 10) / 10;
    if (w < 0)
      deadlineNote = (
        <span className="inline-flex items-center gap-1 text-critical">
          <TriangleAlertIcon className="size-3" aria-hidden />
          Ends {plural(Math.abs(Math.round(w)) || 1, "wk")} after the deadline
        </span>
      );
    else if (w < 2)
      deadlineNote = (
        <span className="inline-flex items-center gap-1 text-warning">
          <TriangleAlertIcon className="size-3" aria-hidden />
          Tight: {w < 1 ? "under a week" : `${Math.round(w)} wk`} of slack
        </span>
      );
    else deadlineNote = <span className="text-good">{Math.round(w)} wks of slack</span>;
  }

  return (
    <Section>
      <SectionLabel icon={CalendarIcon}>Timeline</SectionLabel>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <span className="font-medium tabular">{formatDate(start)}</span>
        <span className="text-muted-foreground" aria-label="to">
          →
        </span>
        <span className="font-medium tabular">{formatDate(lastDay)}</span>
        <span className="text-muted-foreground">· {plural(req.durationWeeks, "wk")}</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Deadline</dt>
          <dd className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground tabular">{deadline ? formatDate(deadline) : "None"}</span>
            {deadlineNote}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">Start flexibility</dt>
          <dd className="font-medium text-foreground tabular">
            {req.startFlexibilityWeeks > 0 ? `±${plural(req.startFlexibilityWeeks, "wk")}` : "Fixed start"}
          </dd>
        </div>
      </dl>

      <ol className="relative mt-1 flex flex-col gap-3 pl-5" aria-label="Key dates">
        <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-border" />
        {events.map((e, i) => (
          <li key={`${e.kind}-${e.date}-${i}`} className="relative flex items-baseline justify-between gap-3 text-sm">
            <span
              aria-hidden
              className={cn(
                "absolute top-1.5 -left-5 size-[11px] rounded-full border-2 bg-card",
                e.kind === "start" && "border-primary bg-primary",
                e.kind === "milestone" && "border-primary",
                e.kind === "end" && "border-muted-foreground/60",
                e.kind === "deadline" && "border-critical",
              )}
            />
            <span className={cn("flex min-w-0 items-center gap-1.5", e.kind === "milestone" && "font-medium")}>
              {e.kind === "deadline" ? <FlagIcon className="size-3.5 shrink-0 text-critical" aria-hidden /> : null}
              <span className="truncate">{e.label}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular">{formatDate(e.date, false)}</span>
          </li>
        ))}
      </ol>
      {milestones.length === 0 ? <p className="text-xs text-muted-foreground">No client milestones.</p> : null}
    </Section>
  );
}

// ---------------------------------------------------------------- capacity needs

function CapacitySection({ opportunity }: { opportunity: Opportunity }) {
  const req = opportunity.requirements;
  const effort = req.hoursPerWeek * req.durationWeeks;
  const stats = [
    { label: "Hours / week", value: `${req.hoursPerWeek} h` },
    { label: "Team size", value: plural(req.teamSize, "person", "people") },
    { label: "Total effort", value: `${effort.toLocaleString("en-US")} h` },
  ];
  return (
    <Section>
      <SectionLabel icon={UsersIcon}>Capacity needs</SectionLabel>
      <dl className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
            <dd className="text-sm font-semibold tabular">{s.value}</dd>
          </div>
        ))}
      </dl>
      {req.roles.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs text-muted-foreground">Roles</span>
          {req.roles.map((r) => (
            <span key={r} className="inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium">
              {r}
            </span>
          ))}
        </div>
      ) : null}
    </Section>
  );
}

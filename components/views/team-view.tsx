"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ClockIcon, GaugeIcon, TrendingUpIcon, UsersIcon, UserIcon } from "lucide-react";
import { useAppState } from "@/lib/store/react";
import { UTILIZATION_LABEL } from "@/lib/capacity";
import { formatMonth, todayISO } from "@/lib/dates";
import { HEAT_VARS } from "@/lib/palette";
import { teamSnapshot } from "@/lib/charts/team";
import { PageHeader } from "@/components/shell/page-header";
import { AnimatedNumber } from "@/components/effects/animated-number";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCapacityCard } from "@/components/team/team-capacity-card";
import { TeamHeatmapCard } from "@/components/team/team-heatmap-card";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function TeamView() {
  const hydrated = useAppState((s) => s.hydrated);
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{hydrated ? <TeamContent /> : <TeamSkeleton />}</div>;
}

function Reveal({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function TeamContent() {
  const members = useAppState((s) => s.members);
  const projects = useAppState((s) => s.projects);
  const today = todayISO();
  const snap = React.useMemo(() => teamSnapshot(members, projects, today), [members, projects, today]);
  const util = snap.contracted > 0 ? Math.round((snap.bookedNow / snap.contracted) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Team"
        description="Who is booked, who has room, and how the next months fill up. Every number comes from committed project assignments."
      />
      <Reveal index={0}>
        <section aria-label="Team summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiTile icon={<UsersIcon aria-hidden />} label="Team size" value={snap.size} detail={`${projects.length} active or planned projects`} />
          <KpiTile icon={<ClockIcon aria-hidden />} label="Contracted" value={snap.contracted} unit="h/wk" detail="Across the whole team" />
          <KpiTile icon={<UserIcon aria-hidden />} label="Booked now" value={snap.bookedNow} unit="h/wk" detail={`${util}% of contracted hours`} />
          <KpiTile
            icon={<GaugeIcon aria-hidden />}
            label="Open now"
            value={snap.openNow}
            unit="h/wk"
            detail={snap.openNow === 0 ? "No one has free hours" : "Unbooked hours this week"}
          />
          <KpiTile
            icon={<TrendingUpIcon aria-hidden />}
            label="Next 3 months"
            value={snap.nextMonthsUtilization}
            unit="%"
            detail={
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-2 rounded-full ring-1 ring-foreground/15" style={{ background: HEAT_VARS[snap.nextMonthsState] }} />
                {UTILIZATION_LABEL[snap.nextMonthsState]} · {formatMonth(snap.nextMonths[0])}–{formatMonth(snap.nextMonths[snap.nextMonths.length - 1])}
              </span>
            }
            className="col-span-2 sm:col-span-1"
          />
        </section>
      </Reveal>
      <Reveal index={1}>
        <TeamCapacityCard />
      </Reveal>
      <Reveal index={2}>
        <TeamHeatmapCard defaultRange="12" />
      </Reveal>
    </>
  );
}

function KpiTile({
  icon,
  label,
  value,
  unit,
  detail,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4 shadow-xs", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-2xl leading-none font-semibold tracking-tight tabular">
        <AnimatedNumber value={value} />
        {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </div>
      {detail ? <div className="line-clamp-2 text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

export function TeamSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4", i === 4 && "col-span-2 sm:col-span-1")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <CardSkeleton rows={8} />
      <CardSkeleton rows={9} cells />
    </>
  );
}

function CardSkeleton({ rows, cells }: { rows: number; cells?: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-7 w-40 rounded-lg" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-28 shrink-0" />
            {cells ? (
              <div className="grid flex-1 grid-cols-6 gap-0.5 sm:grid-cols-12">
                {Array.from({ length: 12 }, (_, j) => (
                  <Skeleton key={j} className={cn("h-8", j >= 6 && "hidden sm:block")} />
                ))}
              </div>
            ) : (
              <Skeleton className="h-3.5 flex-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

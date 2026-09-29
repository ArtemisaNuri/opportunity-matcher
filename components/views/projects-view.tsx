"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CalendarIcon, ClockIcon, RocketIcon } from "lucide-react";
import { useAppState } from "@/lib/store/react";
import { teamCapacityByMonth } from "@/lib/capacity";
import { formatDate, formatMonth, todayISO } from "@/lib/dates";
import type { Project, TeamMember } from "@/lib/domain/types";
import { projectColor } from "@/lib/palette";
import { buildWorkloadRows, chartWindow, overloadedMonths, projectSeries, visibleSeries } from "@/lib/charts/workload";
import { projectSummary } from "@/lib/charts/projects";
import { PageHeader } from "@/components/shell/page-header";
import { StageBadge } from "@/components/scoring/badges";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarStack } from "@/components/team/member-avatar";
import { GanttChart, seriesToGanttItems } from "@/components/charts/gantt-chart";
import { WorkloadAreaChart } from "@/components/charts/workload-area-chart";
import { CapacityStatusChip, OverloadList } from "@/components/charts/chart-parts";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ProjectsView() {
  const hydrated = useAppState((s) => s.hydrated);
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{hydrated ? <ProjectsContent /> : <ProjectsSkeleton />}</div>
  );
}

function Reveal({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function ProjectsContent() {
  const members = useAppState((s) => s.members);
  const projects = useAppState((s) => s.projects);
  const today = todayISO();

  const months = React.useMemo(() => chartWindow(today, undefined, { min: 12, max: 12 }), [today]);
  const series = React.useMemo(() => visibleSeries(projectSeries(projects, months), months), [projects, months]);
  const rows = React.useMemo(
    () => buildWorkloadRows({ months, series, capacity: teamCapacityByMonth(members, months) }),
    [months, series, members],
  );
  const overloads = React.useMemo(() => overloadedMonths(rows), [rows]);
  const ordered = React.useMemo(
    () => [...projects].sort((a, b) => a.launch.localeCompare(b.launch) || a.colorSlot - b.colorSlot),
    [projects],
  );
  const range = `${formatMonth(months[0], "long")} to ${formatMonth(months[months.length - 1], "long")}`;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Committed work, its timeline, and how much of the team's capacity it uses month by month."
      />

      <section aria-label="Projects" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((p, i) => (
          <Reveal key={p.id} index={i}>
            <ProjectCard project={p} members={members} today={today} />
          </Reveal>
        ))}
      </section>

      <Reveal index={ordered.length}>
        <Card className="min-w-0 gap-4" data-testid="projects-timeline">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription className="text-xs">Start to launch for every project, with milestones. Hover a bar for details.</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <GanttChart
              months={months}
              items={seriesToGanttItems(projectSeries(projects, months))}
              today={today}
              ariaLabel={`Timeline of ${projects.length} projects, ${range}.`}
            />
          </div>
        </Card>
      </Reveal>

      <Reveal index={ordered.length + 1}>
        <Card className="min-w-0 gap-4" data-testid="projects-workload">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle>Workload vs capacity</CardTitle>
              <CardDescription className="text-xs">Hours per month booked on each project against what the team can deliver.</CardDescription>
            </div>
            <CapacityStatusChip overloaded={overloads.length} />
          </CardHeader>
          <div className="flex flex-col gap-4 px-5 pb-5">
            <WorkloadAreaChart
              rows={rows}
              series={series}
              ariaLabel={`Stacked hours per month for ${series.length} projects against team capacity, ${range}. ${
                overloads.length === 0 ? "Every month is within capacity." : `${overloads.length} months over capacity.`
              }`}
            />
            <OverloadList months={overloads} />
          </div>
        </Card>
      </Reveal>
    </>
  );
}

function ProjectCard({ project, members, today }: { project: Project; members: TeamMember[]; today: string }) {
  const s = projectSummary(project, today);
  const color = projectColor(project.colorSlot);
  const team = s.memberIds.map((id) => members.find((m) => m.id === id)).filter((m): m is TeamMember => Boolean(m));
  return (
    <article
      data-project={project.id}
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
            <span className="truncate">{project.name}</span>
          </h2>
          <p className="truncate text-xs text-muted-foreground">{project.client}</p>
        </div>
        <StageBadge stage={project.stage} />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarIcon aria-hidden className="size-3.5" />
        <span className="tabular">
          {formatDate(project.start, false)} → {formatDate(project.launch)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-medium">
            <span className="tabular">{s.elapsedPct}%</span> <span className="font-normal text-muted-foreground">of timeline</span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-muted-foreground",
              s.phase === "active" && s.daysToLaunch <= 21 && "font-medium text-foreground",
            )}
          >
            <RocketIcon aria-hidden className="size-3.5" />
            {s.countdown}
          </span>
        </div>
        <div
          className="relative h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={s.elapsedPct}
          aria-label={`${s.elapsedPct}% of the timeline elapsed`}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: color, width: `${s.elapsedPct}%`, originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3.5">
        <AvatarStack members={team} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon aria-hidden className="size-3.5" />
          {s.phase === "active" ? (
            <>
              <span className="font-medium text-foreground tabular">{s.hoursNow}</span> h/wk now
            </>
          ) : (
            <>
              up to <span className="font-medium text-foreground tabular">{s.peakHours}</span> h/wk
            </>
          )}
        </span>
      </div>
    </article>
  );
}

function ProjectsSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex items-center justify-between border-t pt-3.5">
              <div className="flex -space-x-1.5">
                {Array.from({ length: 4 }, (_, j) => (
                  <Skeleton key={j} className="size-8 rounded-full ring-2 ring-card" />
                ))}
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      {[0, 1].map((k) => (
        <div key={k} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ))}
    </>
  );
}

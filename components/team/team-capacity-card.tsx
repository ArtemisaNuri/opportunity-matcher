"use client";

import * as React from "react";
import { motion } from "motion/react";
import { FolderKanbanIcon, TriangleAlertIcon, UserIcon } from "lucide-react";
import { useAppState } from "@/lib/store/react";
import { formatDate, todayISO } from "@/lib/dates";
import { projectColor } from "@/lib/palette";
import { capacityTotals, memberCapacityRows, projectGroups, type MemberCapacityRow, type ProjectGroup } from "@/lib/charts/team";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { MemberIdentity } from "@/components/team/member-avatar";
import { UtilizationBar } from "@/components/team/heat";
import { cn } from "@/lib/utils";

type Mode = "member" | "project";

const EASE = [0.22, 1, 0.36, 1] as const;

function Hours({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("tabular", className)}>
      {value.toLocaleString("en-US")}
      <span className="ml-0.5 text-muted-foreground">h</span>
    </span>
  );
}

function OpenHours({ open }: { open: number }) {
  if (open < 0) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-critical">
        <TriangleAlertIcon aria-hidden className="size-3.5" />
        <span className="tabular">−{Math.abs(open)}</span>
        <span className="ml-0.5 text-muted-foreground">h</span>
        <span className="sr-only"> overbooked</span>
      </span>
    );
  }
  return <Hours value={open} className={open === 0 ? "text-muted-foreground" : "font-medium"} />;
}

const TH = "h-9 px-2.5 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground";
const TD = "px-2.5 py-2.5 align-middle whitespace-nowrap";

export function TeamCapacityCard({ asOf, className }: { asOf?: string; className?: string }) {
  const members = useAppState((s) => s.members);
  const projects = useAppState((s) => s.projects);
  const date = asOf ?? todayISO();
  const [mode, setMode] = React.useState<Mode>("member");

  const rows = React.useMemo(() => memberCapacityRows(members, projects, date), [members, projects, date]);
  const totals = React.useMemo(() => capacityTotals(rows), [rows]);
  const groups = React.useMemo(() => projectGroups(members, projects, date), [members, projects, date]);
  const rowById = React.useMemo(() => new Map(rows.map((r) => [r.member.id, r])), [rows]);

  return (
    <Card className={cn("min-w-0 gap-4", className)} data-testid="team-capacity-card">
      <CardHeader className="flex-row flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>Team capacity</CardTitle>
          <CardDescription className="text-xs">Hours per week as of {formatDate(date)}</CardDescription>
        </div>
        <CardAction>
          <Segmented<Mode>
            aria-label="Group team capacity"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "member", label: "By member", icon: <UserIcon aria-hidden /> },
              { value: "project", label: "By project", icon: <FolderKanbanIcon aria-hidden /> },
            ]}
          />
        </CardAction>
      </CardHeader>

      <div className="min-w-0 overflow-x-auto border-t">
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {mode === "member" ? (
            <ByMemberTable rows={rows} totals={totals} />
          ) : (
            <ByProjectTable
              active={groups.active}
              later={groups.later}
              unassigned={groups.unassigned}
              rowById={rowById}
            />
          )}
        </motion.div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ by member

function ByMemberTable({ rows, totals }: { rows: MemberCapacityRow[]; totals: ReturnType<typeof capacityTotals> }) {
  return (
    <table className="w-full min-w-[33rem] text-sm" data-view="by-member">
      <thead className="border-b bg-muted/30">
        <tr>
          <th scope="col" className={cn(TH, "pl-5")}>Member</th>
          <th scope="col" className={cn(TH, "text-right")}>Contracted</th>
          <th scope="col" className={cn(TH, "text-right")}>Current</th>
          <th scope="col" className={cn(TH, "text-right")}>Open</th>
          <th scope="col" className={cn(TH, "pr-5")}>Utilization</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <motion.tr
            key={r.member.id}
            data-member={r.member.id}
            className="border-b transition-colors last:border-b-0 hover:bg-muted/40"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.03 * i, ease: EASE }}
          >
            <td className={cn(TD, "pl-5")}>
              <MemberIdentity member={r.member} />
            </td>
            <td className={cn(TD, "text-right")}>
              <Hours value={r.contracted} className="text-muted-foreground" />
            </td>
            <td className={cn(TD, "text-right")}>
              <Hours value={r.current} />
            </td>
            <td className={cn(TD, "text-right")}>
              <OpenHours open={r.open} />
            </td>
            <td className={cn(TD, "pr-5")}>
              <UtilizationBar percent={r.utilization} state={r.state} />
            </td>
          </motion.tr>
        ))}
      </tbody>
      <tfoot className="border-t bg-muted/30 text-sm font-medium">
        <tr>
          <th scope="row" className={cn(TD, "pl-5 text-left")}>
            Team total <span className="font-normal text-muted-foreground">· {rows.length} people</span>
          </th>
          <td className={cn(TD, "text-right")}>
            <Hours value={totals.contracted} />
          </td>
          <td className={cn(TD, "text-right")}>
            <Hours value={totals.current} />
          </td>
          <td className={cn(TD, "text-right")}>
            <Hours value={totals.open} />
            {totals.overbooked > 0 ? (
              <div className="text-[11px] font-normal text-muted-foreground">
                <span className="tabular">{totals.overbooked}</span> h overbooked
              </div>
            ) : null}
          </td>
          <td className={cn(TD, "pr-5")}>
            <UtilizationBar percent={totals.utilization} state={totals.state} />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// ------------------------------------------------------------------ by project

function GroupHeader({
  swatch,
  title,
  subtitle,
  meta,
  total,
  className,
}: {
  swatch: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  total?: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-b bg-muted/35", className)}>
      <th scope="colgroup" colSpan={3} className="px-5 py-2 text-left font-normal">
        <div className="flex min-w-0 items-center gap-2.5">
          {swatch}
          <span className="shrink-0 text-sm font-semibold whitespace-nowrap">{title}</span>
          {subtitle ? <span className="min-w-0 truncate text-xs text-muted-foreground">{subtitle}</span> : null}
          {meta ? <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">· {meta}</span> : null}
        </div>
      </th>
      <td className="px-5 py-2 text-right text-xs font-medium whitespace-nowrap">{total}</td>
    </tr>
  );
}

function ProjectGroupRows({
  group,
  rowById,
  later,
  offset,
}: {
  group: ProjectGroup;
  rowById: Map<string, MemberCapacityRow>;
  later?: boolean;
  offset: number;
}) {
  const p = group.project;
  return (
    <>
      <GroupHeader
        swatch={<span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: projectColor(p.colorSlot) }} />}
        title={p.name}
        subtitle={p.client}
        meta={later ? `starts ${formatDate(p.start, false)}` : `launches ${formatDate(p.launch, false)}`}
        total={
          <span className="tabular">
            {group.totalHours} <span className="text-muted-foreground">h/wk{later ? " planned" : ""}</span>
          </span>
        }
        className={later ? "bg-muted/20" : undefined}
      />
      {group.members.map((m, i) => {
        const r = rowById.get(m.member.id);
        return (
          <motion.tr
            key={m.member.id}
            className={cn("border-b hover:bg-muted/40", later && "text-muted-foreground")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.02 * (offset + i) }}
          >
            <td className={cn(TD, "pl-9")}>
              <MemberIdentity member={m.member} />
            </td>
            <td className={cn(TD, "text-right")}>
              <span className="tabular font-medium text-foreground">{m.hours}</span>
              <span className="ml-0.5 text-muted-foreground">h/wk</span>
              {m.from ? <div className="text-[11px] text-muted-foreground">from {formatDate(m.from, false)}</div> : null}
            </td>
            <td className={cn(TD, "text-right text-xs text-muted-foreground")}>
              {r ? (
                <>
                  <span className="tabular">{r.current}</span> / <span className="tabular">{r.contracted}</span> h booked
                </>
              ) : null}
            </td>
            <td className={cn(TD, "pr-5")}>{r && !later ? <UtilizationBar percent={r.utilization} state={r.state} showLabel={false} className="justify-end" /> : null}</td>
          </motion.tr>
        );
      })}
    </>
  );
}

function ByProjectTable({
  active,
  later,
  unassigned,
  rowById,
}: {
  active: ProjectGroup[];
  later: ProjectGroup[];
  unassigned: MemberCapacityRow[];
  rowById: Map<string, MemberCapacityRow>;
}) {
  let offset = 0;
  const next = (n: number) => {
    const o = offset;
    offset += n + 1;
    return o;
  };
  return (
    <table className="w-full min-w-[31rem] text-sm" data-view="by-project">
      <thead className="border-b bg-muted/30">
        <tr>
          <th scope="col" className={cn(TH, "pl-5")}>Project · member</th>
          <th scope="col" className={cn(TH, "text-right")}>On project</th>
          <th scope="col" className={cn(TH, "text-right")}>Their week</th>
          <th scope="col" className={cn(TH, "pr-5 text-right")}>Utilization</th>
        </tr>
      </thead>
      <tbody>
        {active.map((g) => (
          <ProjectGroupRows key={g.project.id} group={g} rowById={rowById} offset={next(g.members.length)} />
        ))}

        <GroupHeader
          swatch={
            <span aria-hidden className="flex size-2.5 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground" />
          }
          title="Not on a project"
          subtitle={unassigned.length === 0 ? "Everyone is booked" : `${unassigned.length} ${unassigned.length === 1 ? "person" : "people"}`}
          total={
            unassigned.length > 0 ? (
              <span className="tabular">
                {unassigned.reduce((s, r) => s + r.contracted, 0)} <span className="text-muted-foreground">h/wk open</span>
              </span>
            ) : null
          }
        />
        {unassigned.map((r) => (
          <tr key={r.member.id} className="border-b hover:bg-muted/40" data-unassigned={r.member.id}>
            <td className={cn(TD, "pl-9")}>
              <MemberIdentity member={r.member} />
            </td>
            <td className={cn(TD, "text-right text-muted-foreground")}>—</td>
            <td className={cn(TD, "text-right text-xs text-muted-foreground")}>
              <span className="tabular font-medium text-foreground">{r.contracted}</span> h/wk open
            </td>
            <td className={cn(TD, "pr-5")}>
              <UtilizationBar percent={r.utilization} state={r.state} showLabel={false} className="justify-end" />
            </td>
          </tr>
        ))}

        {later.length > 0 ? (
          <>
            <tr aria-hidden>
              <td colSpan={4} className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Starting later
                  <span className="h-px flex-1 bg-border" />
                </div>
              </td>
            </tr>
            {later.map((g) => (
              <ProjectGroupRows key={g.project.id} group={g} rowById={rowById} later offset={next(g.members.length)} />
            ))}
          </>
        ) : null}
      </tbody>
    </table>
  );
}

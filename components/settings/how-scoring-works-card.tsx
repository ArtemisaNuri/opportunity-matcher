import * as React from "react";
import { InfoIcon, ShieldAlertIcon } from "lucide-react";
import { CATEGORY_LABEL, type MatchCategory } from "@/lib/domain/types";
import { FACTOR_MAX } from "@/lib/scoring/engine";
import { CATEGORY_CLASSES } from "@/lib/palette";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryPill } from "@/components/scoring/category-pill";
import { FACTOR_ICON, FACTOR_INFO } from "@/components/detail/shared";
import { SettingsCard } from "@/components/settings/settings-card";
import { cn } from "@/lib/utils";

const RULES: { category: MatchCategory; range: string; rule: string }[] = [
  { category: "top", range: "90–100", rule: "and the capacity gate passes" },
  { category: "queued", range: "90–100", rule: "but the capacity gate fails" },
  { category: "backup", range: "80–89", rule: "" },
  { category: "deferred", range: "70–79", rule: "" },
  { category: "bad", range: "0–69", rule: "or any restricted sector" },
];

/** Read-only reference: factor weights and category thresholds. */
export function HowScoringWorksCard({ gateRatio }: { gateRatio: number }) {
  const gate = Math.round(gateRatio * 100);
  return (
    <SettingsCard
      id="how"
      icon={InfoIcon}
      title="How Smart Scoring works"
      description="A deterministic rule set: the same inputs always give the same score."
    >
      <div className="flex flex-col gap-6 border-t px-5 py-5 sm:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table aria-label="Factor weights">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Factor</TableHead>
                <TableHead className="w-40">Max points</TableHead>
                <TableHead>What it measures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FACTOR_INFO.map((f) => {
                const Icon = FACTOR_ICON[f.key];
                const max = FACTOR_MAX[f.key];
                return (
                  <TableRow key={f.key}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                        {f.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${(max / 25) * 100}%` }} />
                        </span>
                        <span className="font-medium tabular">{max}</span>
                      </span>
                    </TableCell>
                    <TableCell className="min-w-64 whitespace-normal text-muted-foreground">{f.measures}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="hover:bg-transparent">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="font-semibold tabular">100</TableCell>
                <TableCell className="text-muted-foreground">Rounded, clamped to 0–100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Category thresholds</h3>
          <ThresholdScale />
          <ul className="grid gap-2 sm:grid-cols-2">
            {RULES.map((r) => (
              <li key={r.category} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <CategoryPill category={r.category} />
                <span className="font-medium tabular">{r.range}</span>
                {r.rule ? <span className="text-muted-foreground">{r.rule}</span> : null}
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
            The capacity gate passes when at least {gate}% of the delivery months fit within team capacity. A restricted
            sector is always a {CATEGORY_LABEL.bad}, whatever the score.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}

/** 0–100 bar with the 70/80/90 cut points; the 90+ segment splits into Top (gate passes) over Queued (gate fails). */
function ThresholdScale() {
  const seg = (cat: MatchCategory) => CATEGORY_CLASSES[cat];
  return (
    <div className="flex flex-col gap-1.5" role="img" aria-label="Score scale: 0 to 69 Bad, 70 to 79 Deferred, 80 to 89 Backup, 90 and above Top if the capacity gate passes, otherwise Queued">
      <div className="flex h-9 w-full gap-0.5 overflow-hidden rounded-lg">
        <div className={cn("flex items-center px-2.5 text-xs font-medium", seg("bad").bg, seg("bad").text)} style={{ width: "70%" }}>
          Bad
        </div>
        <div className={cn("flex items-center justify-center text-xs font-medium", seg("deferred").bg, seg("deferred").text)} style={{ width: "10%" }}>
          <span className="hidden sm:inline">Deferred</span>
        </div>
        <div className={cn("flex items-center justify-center text-xs font-medium", seg("backup").bg, seg("backup").text)} style={{ width: "10%" }}>
          <span className="hidden sm:inline">Backup</span>
        </div>
        <div className="flex flex-col gap-0.5" style={{ width: "10%" }}>
          <div className={cn("flex flex-1 items-center justify-center text-[10px] font-medium", seg("top").bg, seg("top").text)}>
            <span className="hidden sm:inline">Top</span>
          </div>
          <div className={cn("flex flex-1 items-center justify-center text-[10px] font-medium", seg("queued").bg, seg("queued").text)}>
            <span className="hidden sm:inline">Queued</span>
          </div>
        </div>
      </div>
      <div className="relative h-4 text-[11px] text-muted-foreground tabular" aria-hidden>
        {[0, 70, 80, 90, 100].map((v) => (
          <span
            key={v}
            className={cn(
              "absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full",
              v === 100 && "hidden sm:inline",
            )}
            style={{ left: `${v}%` }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

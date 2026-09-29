"use client";

import * as React from "react";
import { toast } from "sonner";
import { RotateCcwIcon, SaveIcon, SlidersHorizontalIcon } from "lucide-react";
import { STAGE_LABEL, type ProjectStage, type Settings } from "@/lib/domain/types";
import { budgetBandPoints, budgetBandStarts } from "@/lib/scoring/engine";
import { formatMoney } from "@/lib/format";
import { useAppState, useAppStore } from "@/lib/store/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { TagInput } from "@/components/ui/tag-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FieldRow, SettingsCard } from "@/components/settings/settings-card";
import { cn } from "@/lib/utils";

const STAGES: ProjectStage[] = ["full_build", "prototype", "recovery"];
const GATE_OPTIONS = [0.6, 0.7, 0.8, 0.9, 1];

interface Draft {
  minBudget: string;
  restrictedSectors: string[];
  preferredTags: string[];
  stageFit: Record<ProjectStage, string>;
  capacityGateRatio: number;
}

type Errors = Partial<Record<"minBudget" | ProjectStage, string>>;

function toDraft(s: Settings): Draft {
  return {
    minBudget: String(s.minBudget),
    restrictedSectors: [...s.restrictedSectors],
    preferredTags: [...s.preferredTags],
    stageFit: {
      full_build: String(s.stageFit.full_build),
      prototype: String(s.stageFit.prototype),
      recovery: String(s.stageFit.recovery),
    },
    capacityGateRatio: s.capacityGateRatio,
  };
}

function validate(d: Draft): Errors {
  const e: Errors = {};
  const min = Number(d.minBudget);
  if (d.minBudget.trim() === "" || !Number.isFinite(min)) e.minBudget = "Enter an amount in dollars.";
  else if (min < 0) e.minBudget = "The minimum budget can’t be negative.";
  for (const st of STAGES) {
    const raw = d.stageFit[st];
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(n) || n < 0 || n > 10) e[st] = "Whole number from 0 to 10.";
  }
  return e;
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Only the keys that actually changed. Assumes the draft is valid. */
function diff(d: Draft, s: Settings): Partial<Settings> {
  const patch: Partial<Settings> = {};
  const min = Number(d.minBudget);
  if (min !== s.minBudget) patch.minBudget = min;
  if (!sameList(d.restrictedSectors, s.restrictedSectors)) patch.restrictedSectors = d.restrictedSectors;
  if (!sameList(d.preferredTags, s.preferredTags)) patch.preferredTags = d.preferredTags;
  if (d.capacityGateRatio !== s.capacityGateRatio) patch.capacityGateRatio = d.capacityGateRatio;
  if (STAGES.some((st) => Number(d.stageFit[st]) !== s.stageFit[st])) {
    patch.stageFit = {
      full_build: Number(d.stageFit.full_build),
      prototype: Number(d.stageFit.prototype),
      recovery: Number(d.stageFit.recovery),
    };
  }
  return patch;
}

function isDirty(d: Draft, s: Settings): boolean {
  const init = toDraft(s);
  return (
    d.minBudget.trim() !== init.minBudget ||
    !sameList(d.restrictedSectors, init.restrictedSectors) ||
    !sameList(d.preferredTags, init.preferredTags) ||
    d.capacityGateRatio !== init.capacityGateRatio ||
    STAGES.some((st) => d.stageFit[st].trim() !== init.stageFit[st])
  );
}

export function ScoringRulesCard() {
  const store = useAppStore();
  const settings = useAppState((s) => s.settings);
  const opportunities = useAppState((s) => s.opportunities);
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(settings));
  const [showErrors, setShowErrors] = React.useState(false);

  // Re-sync when settings change underneath (save, demo reset).
  React.useEffect(() => {
    setDraft(toDraft(settings));
    setShowErrors(false);
  }, [settings]);

  const errors = React.useMemo(() => validate(draft), [draft]);
  const valid = Object.keys(errors).length === 0;
  const dirty = isDirty(draft, settings);
  const visibleErrors: Errors = showErrors ? errors : {};

  const sectorSuggestions = React.useMemo(
    () => [...new Set(opportunities.map((o) => o.sector).filter(Boolean))].sort(),
    [opportunities],
  );
  const tagSuggestions = React.useMemo(
    () => [...new Set(opportunities.flatMap((o) => o.profileTags))].sort(),
    [opportunities],
  );

  const previewMin = errors.minBudget ? settings.minBudget : Number(draft.minBudget);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setShowErrors(true);
      return;
    }
    const patch = diff(draft, settings);
    if (Object.keys(patch).length === 0) return;
    const affected = opportunities.filter((o) => o.scoring.result).length;
    store.updateSettings(patch);
    toast.success(`Settings saved · ${affected} score${affected === 1 ? "" : "s"} marked stale`, {
      description: affected > 0 ? "Re-score them to apply the new rules." : undefined,
    });
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <SettingsCard
      id="rules"
      icon={SlidersHorizontalIcon}
      title="Scoring rules"
      description="These inputs feed Smart Scoring. Saving marks existing scores as stale."
    >
      <form onSubmit={save} noValidate className="flex flex-col divide-y border-t">
        <FieldRow
          label="Minimum viable budget"
          htmlFor="min-budget"
          caption="Budgets under this amount score 5 of 20 points (under $5k scores 0). Bands above it are fixed: $20k → 17, $40k+ → 20."
          error={visibleErrors.minBudget}
          errorId="min-budget-error"
        >
          <div className="relative w-full sm:w-48">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="min-budget"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={draft.minBudget}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("minBudget", e.target.value)}
              aria-invalid={Boolean(visibleErrors.minBudget)}
              aria-describedby={visibleErrors.minBudget ? "min-budget-error" : undefined}
              className="pl-6 tabular"
            />
          </div>
          <BudgetBandsPreview minBudget={previewMin} budgets={opportunities.map((o) => o.clientBudget)} />
        </FieldRow>

        <FieldRow
          label="Restricted sectors"
          htmlFor="restricted-sectors"
          caption="Opportunities in these sectors are always a Bad Match."
        >
          <TagInput
            id="restricted-sectors"
            value={draft.restrictedSectors}
            onChange={(v) => set("restrictedSectors", v)}
            suggestions={sectorSuggestions}
            placeholder="Add a sector and press Enter"
          />
        </FieldRow>

        <FieldRow
          label="Focus areas"
          htmlFor="preferred-tags"
          caption="Preferred profile tags. Matching tags earn up to 15 points for profile fit."
        >
          <TagInput
            id="preferred-tags"
            value={draft.preferredTags}
            onChange={(v) => set("preferredTags", v)}
            suggestions={tagSuggestions}
            placeholder="Add a tag and press Enter"
          />
        </FieldRow>

        <FieldRow label="Stage fit points" caption="Points out of 10 for each kind of engagement.">
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {STAGES.map((st) => (
              <div key={st} className="flex flex-col gap-1.5">
                <label htmlFor={`stage-${st}`} className="text-xs text-muted-foreground">
                  {STAGE_LABEL[st]}
                </label>
                <Input
                  id={`stage-${st}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10}
                  step={1}
                  value={draft.stageFit[st]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("stageFit", { ...draft.stageFit, [st]: e.target.value })}
                  aria-invalid={Boolean(visibleErrors[st])}
                  aria-describedby={visibleErrors[st] ? `stage-${st}-error` : undefined}
                  className="tabular"
                />
                {visibleErrors[st] ? (
                  <p id={`stage-${st}-error`} className="text-[11px] font-medium text-destructive">
                    {visibleErrors[st]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </FieldRow>

        <FieldRow
          label="Capacity gate"
          caption="Share of delivery months the team must be able to absorb. Separates Top Match from Queued Match for scores of 90+."
        >
          <Segmented
            aria-label="Capacity gate threshold"
            value={String(draft.capacityGateRatio)}
            onValueChange={(v) => set("capacityGateRatio", Number(v))}
            size="md"
            options={[...new Set([...GATE_OPTIONS, draft.capacityGateRatio])]
              .sort((a, b) => a - b)
              .map((r) => ({ value: String(r), label: `${Math.round(r * 100)}%` }))}
          />
          <p className="text-xs text-muted-foreground">
            At {Math.round(draft.capacityGateRatio * 100)}%, a 5-month project needs{" "}
            <span className="font-medium text-foreground tabular">{Math.ceil(draft.capacityGateRatio * 5 - 1e-9)} of 5</span>{" "}
            months within capacity.
          </p>
        </FieldRow>

        <div className="flex flex-col-reverse gap-3 rounded-b-xl bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {dirty ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                Unsaved changes
              </span>
            ) : (
              "All changes saved"
            )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!dirty}
              onClick={() => {
                setDraft(toDraft(settings));
                setShowErrors(false);
              }}
            >
              <RotateCcwIcon aria-hidden />
              Discard
            </Button>
            <Button type="submit" disabled={!dirty}>
              <SaveIcon aria-hidden />
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </SettingsCard>
  );
}

/** Live preview of the 5 budget bands for a given minimum, with how many current opportunities fall in each. */
function BudgetBandsPreview({ minBudget, budgets }: { minBudget: number; budgets: number[] }) {
  const m = minBudget;
  const cuts = budgetBandStarts(m);
  const bands = cuts.map((from, i) => {
    const to = cuts[i + 1];
    const label =
      i === 0
        ? `Under ${formatMoney(to)}`
        : to === undefined
          ? `${formatMoney(from)}+`
          : `${formatMoney(from)} – ${formatMoney(Math.ceil(to) - 1)}`;
    return {
      label,
      points: budgetBandPoints(from, m),
      count: budgets.filter((b) => b >= from && (to === undefined || b < to)).length,
    };
  });
  return (
    <div className="mt-1 overflow-hidden rounded-lg border">
      <Table aria-label="Budget bands">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="h-8">Client budget</TableHead>
            <TableHead className="h-8 text-right">Points</TableHead>
            <TableHead className="h-8 text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bands.map((b) => (
            <TableRow key={b.label}>
              <TableCell className="py-2 tabular">{b.label}</TableCell>
              <TableCell className="py-2 text-right">
                <span className="inline-flex items-center justify-end gap-2">
                  <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:inline-block" aria-hidden>
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(b.points / 20) * 100}%` }} />
                  </span>
                  <span className="w-10 font-medium tabular">{b.points} / 20</span>
                </span>
              </TableCell>
              <TableCell className={cn("py-2 text-right tabular", b.count === 0 && "text-muted-foreground")}>
                {b.count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        −5 points (floor 0) when the budget is below the cost to build.
      </p>
    </div>
  );
}

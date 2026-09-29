"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { CATEGORY_DESCRIPTION, type Opportunity, type ScoreResult, type Settings } from "@/lib/domain/types";
import { ANALYSIS_STAGES, type QueueState } from "@/lib/store/app-store";
import { FACTOR_MAX } from "@/lib/scoring/engine";
import { useAppState, useAppStore } from "@/lib/store/react";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { AnalysisSteps } from "@/components/effects/analysis-steps";
import { AnimatedNumber } from "@/components/effects/animated-number";
import { BorderBeam } from "@/components/effects/border-beam";
import { ShimmerText } from "@/components/effects/shimmer-text";
import { CategoryPill } from "@/components/scoring/category-pill";
import { WhyThisScore } from "@/components/detail/why-this-score";
import { ReviewOverrideMock } from "@/components/detail/review-override-mock";
import { FACTOR_ICON, FACTOR_INFO, plural } from "@/components/detail/shared";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type View = "unscored" | "queued" | "scoring" | "error" | "scored";

function viewOf(opp: Opportunity, queue: QueueState): View {
  if (queue.activeId === opp.id || opp.scoring.status === "scoring") return "scoring";
  if (opp.scoring.status === "queued") return "queued";
  if (opp.scoring.status === "error") return "error";
  if (opp.scoring.status === "scored" && opp.scoring.result) return "scored";
  return "unscored";
}

export function SmartScoringSection({ opportunity, className }: { opportunity: Opportunity; className?: string }) {
  const queue = useAppState((s) => s.queue);
  const settings = useAppState((s) => s.settings);
  const view = viewOf(opportunity, queue);
  const busy = view === "scoring" || view === "queued";

  return (
    <section
      id="analysis"
      aria-labelledby="analysis-heading"
      aria-busy={busy}
      className={cn(
        "relative scroll-mt-20 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      {/* Restrained accent: a violet hairline and a faint glow along the top edge. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 70%)",
        }}
      />
      {view === "scoring" ? <BorderBeam /> : null}

      <div className="relative flex flex-col gap-6 p-5 sm:p-6">
        <SectionHeader opportunity={opportunity} view={view} />
        {view === "unscored" ? <UnscoredState id={opportunity.id} /> : null}
        {view === "queued" ? <QueuedState id={opportunity.id} queue={queue} /> : null}
        {view === "scoring" ? <ScoringState stage={queue.activeId === opportunity.id ? queue.activeStage : 0} /> : null}
        {view === "error" ? <ErrorState id={opportunity.id} /> : null}
        {view === "scored" && opportunity.scoring.result ? (
          <ScoredState
            key={opportunity.scoring.scoredAt ?? "scored"}
            opportunity={opportunity}
            result={opportunity.scoring.result}
            settings={settings}
          />
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- header

function SectionHeader({ opportunity, view }: { opportunity: Opportunity; view: View }) {
  const store = useAppStore();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 ring-inset">
          <SparklesIcon className="size-4.5" aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-primary">Smart Scoring</p>
          <h2 id="analysis-heading" className="text-lg leading-tight font-semibold">
            Opportunity Analysis
          </h2>
        </div>
      </div>
      {view === "scored" ? (
        <Button variant="outline" size="sm" onClick={() => store.enqueue([opportunity.id])}>
          <RefreshCwIcon aria-hidden />
          Re-score
        </Button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- unscored

function UnscoredState({ id }: { id: string }) {
  const store = useAppStore();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
          Scores this opportunity against current team capacity, project timelines and your settings.{" "}
          <span className="text-foreground">Deterministic: the same inputs always give the same result.</span>
        </p>
        <Button size="lg" onClick={() => store.enqueue([id])} className="relative overflow-hidden">
          <BorderBeam color="var(--primary-foreground)" className="opacity-70" />
          <SparklesIcon aria-hidden />
          Score now
        </Button>
        <p className="text-xs text-muted-foreground">Takes a couple of seconds and runs in the background.</p>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Factors and their maximum points">
        {FACTOR_INFO.map((f, i) => {
          const Icon = FACTOR_ICON[f.key];
          return (
            <motion.li
              key={f.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: EASE }}
              className="flex items-start gap-3 rounded-lg border bg-background/40 px-3 py-2.5"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-2 text-sm font-medium">
                  {f.label}
                  <span className="text-xs text-muted-foreground tabular">{FACTOR_MAX[f.key]} pts</span>
                </span>
                <span className="text-xs leading-snug text-muted-foreground">{f.measures}</span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- queued

function QueuedState({ id, queue }: { id: string; queue: QueueState }) {
  const idx = queue.pending.indexOf(id);
  const ahead = (idx < 0 ? 0 : idx) + (queue.activeId ? 1 : 0);
  const total = queue.pending.length + (queue.activeId ? 1 : 0);
  return (
    <div className="flex items-center gap-4 rounded-lg border border-dashed bg-muted/20 px-4 py-5">
      <span className="relative flex size-10 items-center justify-center">
        <span aria-hidden className="absolute inset-0 animate-pulse-soft rounded-full bg-primary/15" />
        <ClockIcon className="relative size-4.5 text-primary" aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5" role="status">
        <p className="text-sm font-medium">
          Queued: position <span className="tabular">{ahead + 1}</span> of <span className="tabular">{Math.max(total, ahead + 1)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {ahead > 0
            ? `Waiting for ${plural(ahead, "opportunity", "opportunities")} ahead of it. You can keep working; scoring runs in the background.`
            : "Starting shortly."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- scoring

/** Which factors each presentation stage "checks" (the score itself is computed at the end). */
const STAGE_FACTORS: Record<number, string[]> = {
  0: ["budget", "profile", "stage", "size"],
  1: ["capacity"],
  2: ["timeline"],
};

function ScoringState({ stage }: { stage: number }) {
  const doneAt = (key: string) => {
    for (const [s, keys] of Object.entries(STAGE_FACTORS)) if (keys.includes(key)) return Number(s);
    return 3;
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" role="status" aria-live="polite">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <ShimmerText className="text-base">Analyzing opportunity…</ShimmerText>
          <p className="text-xs text-muted-foreground tabular">
            Step {Math.min(stage + 1, ANALYSIS_STAGES.length)} of {ANALYSIS_STAGES.length} · {ANALYSIS_STAGES[stage]}
          </p>
        </div>
        <AnalysisSteps steps={ANALYSIS_STAGES} active={stage} />
        <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full w-1/2 origin-left animate-progress-indeterminate rounded-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 rounded-lg border bg-background/40 p-4" aria-label="Factors being checked">
        {FACTOR_INFO.map((f, i) => {
          const Icon = FACTOR_ICON[f.key];
          const at = doneAt(f.key);
          const state = stage > at ? "done" : stage === at ? "active" : "todo";
          return (
            <li key={f.key} className="flex items-center gap-3 text-sm">
              <Icon
                className={cn("size-4 shrink-0", state === "todo" ? "text-muted-foreground/50" : "text-muted-foreground")}
                aria-hidden
              />
              <span className={cn("w-40 shrink-0 truncate", state === "todo" && "text-muted-foreground")}>{f.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                {state !== "todo" ? (
                  <div
                    className={cn(
                      "h-full rounded-full",
                      state === "active" ? "w-full animate-pulse-soft bg-primary/60" : "w-full bg-primary/25",
                    )}
                    style={{ animationDelay: `${i * 90}ms` }}
                  />
                ) : null}
              </div>
              <span className="flex w-5 justify-end">
                {state === "done" ? (
                  <CheckIcon className="size-3.5 text-primary" aria-label="checked" />
                ) : state === "active" ? (
                  <LoaderCircleIcon className="size-3.5 animate-spin text-primary" aria-label="checking" />
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- error

function ErrorState({ id }: { id: string }) {
  const store = useAppStore();
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border border-cat-bad/30 bg-cat-bad-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <XCircleIcon className="mt-0.5 size-5 shrink-0 text-cat-bad" aria-hidden />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">The analysis couldn’t be completed</p>
          <p className="text-sm text-muted-foreground">
            Something in this opportunity’s data stopped the scoring engine. Check the dates and numbers, then retry.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => store.enqueue([id])} className="self-start sm:self-center">
        <RotateCcwIcon aria-hidden />
        Retry
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- scored

function ScoredState({
  opportunity,
  result,
  settings,
}: {
  opportunity: Opportunity;
  result: ScoreResult;
  settings: Settings;
}) {
  const store = useAppStore();
  const gate = result.capacityGate;
  const monthCount = gate.months.length;
  const fits = monthCount - result.conflicts.length;
  const required = Math.round(gate.required * 100);

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {opportunity.scoring.stale ? (
        <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm">
            <RefreshCwIcon className="size-4 shrink-0 text-warning" aria-hidden />
            <span>
              <span className="font-medium">Out of date.</span>{" "}
              <span className="text-muted-foreground">Inputs or settings changed since this score.</span>
            </span>
          </p>
          <Button size="sm" variant="outline" onClick={() => store.enqueue([opportunity.id])} className="self-start sm:self-auto">
            <RefreshCwIcon aria-hidden />
            Re-score
          </Button>
        </div>
      ) : null}

      {result.restrictedOverride ? (
        <div role="note" className="flex gap-3 rounded-lg border border-cat-bad/30 bg-cat-bad-soft px-4 py-3 text-sm">
          <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-cat-bad" aria-hidden />
          <p>
            <span className="font-semibold text-cat-bad">{opportunity.sector} is a restricted sector.</span>{" "}
            <span className="text-foreground/85">Bad Match regardless of the {result.total}/100 score.</span>
          </p>
        </div>
      ) : null}

      {/* Result header */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8">
        <div className="flex flex-row items-center gap-5 md:flex-col md:items-start md:gap-3">
          <CategoryPill category={result.category} size="md" />
          <p className="flex items-baseline gap-1">
            <AnimatedNumber value={result.total} className="text-5xl font-semibold tracking-tight tabular" />
            <span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{CATEGORY_DESCRIPTION[result.category]}</p>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground text-pretty">{result.summary}</p>
          <p
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              gate.passed ? "bg-good/10 text-good ring-good/25" : "bg-critical/10 text-critical ring-critical/25",
            )}
          >
            {gate.passed ? (
              <CircleCheckIcon className="size-3.5" aria-hidden />
            ) : (
              <TriangleAlertIcon className="size-3.5" aria-hidden />
            )}
            Capacity gate {gate.passed ? "passed" : "failed"} · {fits} of {plural(monthCount, "month")} fit (needs {required}%)
          </p>
        </div>
      </div>

      <WhyThisScore opportunity={opportunity} result={result} settings={settings} />

      <ReviewOverrideMock />

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Engine: <span className="font-mono">{result.engine}</span>
        {opportunity.scoring.scoredAt ? <> · Scored {formatRelative(opportunity.scoring.scoredAt)}</> : null}
      </p>
    </motion.div>
  );
}

"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { FactorResult, Impact } from "@/lib/domain/types";
import { FACTOR_ICON, fmtPts } from "@/components/detail/shared";
import { cn } from "@/lib/utils";

const IMPACT_BAR: Record<Impact, string> = {
  positive: "bg-good",
  neutral: "bg-primary",
  negative: "bg-critical",
};

const IMPACT_LABEL: Record<Impact, string> = {
  positive: "Strong",
  neutral: "Mixed",
  negative: "Weak",
};

const IMPACT_TEXT: Record<Impact, string> = {
  positive: "text-good",
  neutral: "text-muted-foreground",
  negative: "text-critical",
};

/** The six factor rows (score / max, impact-colored bar, the engine's note) plus the total row. */
export function FactorBars({
  factors,
  rawTotal,
  total,
}: {
  factors: FactorResult[];
  rawTotal: number;
  total: number;
}) {
  const clamped = Math.round(rawTotal) !== total;
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y">
        {factors.map((f, i) => {
          const Icon = FACTOR_ICON[f.key];
          const pct = f.max > 0 ? Math.max(0, Math.min(1, f.score / f.max)) * 100 : 0;
          return (
            <li key={f.key} className="flex flex-col gap-1.5 py-3 first:pt-0">
              <div className="flex items-center gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium sm:w-44 sm:flex-none">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{f.label}</span>
                </span>
                <div
                  className="hidden h-2 flex-1 overflow-hidden rounded-full bg-muted sm:block"
                  role="meter"
                  aria-label={`${f.label}: ${fmtPts(f.score)} of ${f.max} points`}
                  aria-valuemin={0}
                  aria-valuemax={f.max}
                  aria-valuenow={f.score}
                >
                  <motion.div
                    className={cn("h-full rounded-full", IMPACT_BAR[f.impact])}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className={cn("hidden w-12 text-right text-[11px] font-medium sm:inline", IMPACT_TEXT[f.impact])}>
                  {IMPACT_LABEL[f.impact]}
                </span>
                <span className="w-[4.5rem] shrink-0 text-right text-sm whitespace-nowrap tabular">
                  <span className="font-semibold">{fmtPts(f.score)}</span>
                  <span className="text-muted-foreground"> / {f.max}</span>
                </span>
              </div>
              {/* Mobile: the bar gets its own line */}
              <div className="h-1.5 overflow-hidden rounded-full bg-muted sm:hidden" aria-hidden>
                <motion.div
                  className={cn("h-full rounded-full", IMPACT_BAR[f.impact])}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground sm:pl-6">{f.note}</p>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
        <span className="font-semibold">Total</span>
        <span className="tabular">
          <span className="text-muted-foreground">{fmtPts(rawTotal)}</span>
          {fmtPts(rawTotal) !== String(total) ? (
            <>
              <span className="mx-1.5 text-muted-foreground" aria-label={clamped ? "clamped to" : "rounds to"}>
                →
              </span>
              <span className="font-semibold">{total}</span>
            </>
          ) : null}
          <span className="text-muted-foreground"> / 100</span>
        </span>
      </div>
    </div>
  );
}

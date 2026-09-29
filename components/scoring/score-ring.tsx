"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import type { MatchCategory } from "@/lib/domain/types";
import { CATEGORY_COLOR_VAR } from "@/lib/palette";
import { AnimatedNumber } from "@/components/effects/animated-number";
import { cn } from "@/lib/utils";

/** Circular score gauge (0–100) colored by match category, with a count-up label. */
export function ScoreRing({
  value,
  category,
  size = 44,
  stroke,
  className,
  showLabel = true,
}: {
  value: number;
  category: MatchCategory;
  size?: number;
  stroke?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const reduce = useReducedMotion();
  const sw = stroke ?? Math.max(3, Math.round(size / 11));
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${Math.round(value)} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={CATEGORY_COLOR_VAR[category]}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - pct) : c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {showLabel ? (
        <AnimatedNumber
          value={value}
          className="absolute font-semibold tabular"
          format={(n) => String(Math.round(n))}
        />
      ) : null}
    </div>
  );
}

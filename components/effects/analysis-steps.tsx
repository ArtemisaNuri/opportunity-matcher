"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Multi-step loader (Aceternity-style) for the staged Opportunity Analysis.
 * `active` is the index of the running step; steps before it render as done.
 */
export function AnalysisSteps({
  steps,
  active,
  className,
}: {
  steps: readonly string[];
  active: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col gap-2.5", className)}>
      {steps.map((label, i) => {
        const state = i < active ? "done" : i === active ? "active" : "todo";
        return (
          <motion.li
            key={label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: state === "todo" ? 0.45 : 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border transition-colors",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "active" && "border-primary/50 bg-primary/10 text-primary",
                state === "todo" && "border-border text-muted-foreground",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {state === "done" ? (
                  <motion.span key="done" initial={{ scale: 0.4 }} animate={{ scale: 1 }}>
                    <CheckIcon className="size-3.5" />
                  </motion.span>
                ) : state === "active" ? (
                  <motion.span key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <LoaderCircleIcon className="size-3.5 animate-spin" />
                  </motion.span>
                ) : (
                  <span key="todo" className="text-[10px] font-semibold">
                    {i + 1}
                  </span>
                )}
              </AnimatePresence>
            </span>
            <span className={cn(state === "active" ? "text-shimmer" : state === "done" ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}

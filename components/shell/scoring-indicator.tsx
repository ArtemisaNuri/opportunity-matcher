"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2Icon } from "lucide-react";
import { useAppState } from "@/lib/store/react";
import { ANALYSIS_STAGES } from "@/lib/store/app-store";
import { BorderBeam } from "@/components/effects/border-beam";

/** Global "Scoring 2 of 5…" pill with progress; shows a brief "done" state when the batch drains. */
export function ScoringIndicator() {
  const queue = useAppState((s) => s.queue);
  const opportunities = useAppState((s) => s.opportunities);
  const running = queue.activeId !== null || queue.pending.length > 0;
  const [showDone, setShowDone] = React.useState(false);
  const wasRunning = React.useRef(false);

  React.useEffect(() => {
    if (running) {
      wasRunning.current = true;
      setShowDone(false);
      return;
    }
    if (wasRunning.current) {
      wasRunning.current = false;
      setShowDone(true);
      const t = window.setTimeout(() => setShowDone(false), 2600);
      return () => window.clearTimeout(t);
    }
  }, [running]);

  const active = opportunities.find((o) => o.id === queue.activeId);
  const position = Math.min(queue.batchSize, queue.completedInBatch + 1);
  const progress =
    queue.batchSize === 0
      ? 0
      : ((queue.completedInBatch + (queue.activeId ? (queue.activeStage + 1) / ANALYSIS_STAGES.length : 0)) /
          queue.batchSize) *
        100;

  return (
    <div aria-live="polite" className="min-w-0">
      <AnimatePresence mode="wait">
        {running ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative flex h-9 max-w-xs items-center gap-2 overflow-hidden rounded-full border bg-card pr-3 pl-3 shadow-sm sm:gap-3 sm:pr-4"
          >
            <BorderBeam />
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium">
                <span className="hidden sm:inline">Scoring {position} of {queue.batchSize}</span>
                <span className="sm:hidden tabular">
                  {position}/{queue.batchSize}
                </span>
                {active ? <span className="hidden text-muted-foreground sm:inline"> · {active.title}</span> : null}
              </span>
              <span className="mt-1 h-1 w-10 overflow-hidden rounded-full bg-muted sm:w-40">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </div>
          </motion.div>
        ) : showDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-9 items-center gap-2 rounded-full border bg-card px-3 text-xs font-medium shadow-sm"
          >
            <CheckCircle2Icon className="size-4 text-good" /> <span className="hidden sm:inline">All scored</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

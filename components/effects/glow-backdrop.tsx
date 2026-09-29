import * as React from "react";
import { cn } from "@/lib/utils";

/** Soft purple aurora + faded grid behind page headers. Decorative only. */
export function GlowBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-grid-fade" />
      <div className="absolute -top-24 left-1/4 h-64 w-96 rounded-full bg-primary/20 blur-3xl dark:bg-primary/15" />
      <div className="absolute -top-16 right-1/5 h-48 w-72 rounded-full bg-cat-queued/15 blur-3xl" />
    </div>
  );
}

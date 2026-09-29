import * as React from "react";
import { cn } from "@/lib/utils";

/** Text with a travelling purple shimmer, for "analyzing…" states. */
export function ShimmerText({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("text-shimmer font-medium", className)}>{children}</span>;
}

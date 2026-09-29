import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Animated light beam travelling around an element's border (Aceternity-style).
 * Place inside a `relative` container with rounded corners.
 */
export function BorderBeam({ className, color = "var(--primary)" }: { className?: string; color?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 animate-beam rounded-[inherit] p-px", className)}
      style={{
        background: `conic-gradient(from var(--beam-angle), transparent 0deg, transparent 250deg, ${color} 320deg, transparent 360deg)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
      }}
    />
  );
}

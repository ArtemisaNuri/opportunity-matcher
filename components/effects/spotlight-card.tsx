"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a soft spotlight that follows the pointer (Aceternity-style).
 * Use for hero/spotlight surfaces only; regular data cards stay plain.
 */
export function SpotlightCard({
  className,
  children,
  glow = "var(--primary)",
  ...props
}: React.ComponentProps<"div"> & { glow?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "group/spot relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-shadow hover:shadow-md",
        className,
      )}
      style={{ ["--spot-color" as string]: glow }}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(380px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--spot-color) 14%, transparent), transparent 65%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

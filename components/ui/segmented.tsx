"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/** Single-select segmented control (shadcn ToggleGroup, type="single", never empty). */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = "sm",
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: "sm" | "md";
  className?: string;
  "aria-label": string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      aria-label={ariaLabel}
      onValueChange={(v: string) => {
        if (v) onValueChange(v as T);
      }}
      className={cn("inline-flex w-fit items-center rounded-lg bg-muted p-0.5 text-muted-foreground", className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-all outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm [&_svg]:size-3.5",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
          )}
        >
          {o.icon}
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

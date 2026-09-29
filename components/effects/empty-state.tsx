import * as React from "react";
import { cn } from "@/lib/utils";

/** Empty state with a floating stacked-cards illustration. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 px-6 py-14 text-center", className)}>
      <div className="relative h-20 w-28 animate-float" aria-hidden>
        <div className="absolute inset-x-4 top-0 h-14 rotate-[-6deg] rounded-xl border bg-muted" />
        <div className="absolute inset-x-2 top-2 h-14 rotate-[4deg] rounded-xl border bg-accent" />
        <div className="absolute inset-x-0 top-5 flex h-14 items-center gap-2 rounded-xl border bg-card px-3 shadow-md">
          <div className="size-6 rounded-full bg-primary/80" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/30" />
            <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/20" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

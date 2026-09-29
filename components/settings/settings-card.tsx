import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Settings section card with an h2 title (the page h1 comes from PageHeader). */
export function SettingsCard({
  id,
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-0", className)} aria-labelledby={`${id}-title`} role="region">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id={`${id}-title`} className="text-sm font-semibold leading-8">
              {title}
            </h2>
            {description ? <p className="-mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/** A labelled field row: label + caption on the left, control on the right (stacked on mobile). */
export function FieldRow({
  label,
  htmlFor,
  caption,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor?: string;
  caption?: React.ReactNode;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-1.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium">{label}</p>
        )}
        {caption ? <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        {children}
        {error ? (
          <p id={errorId} className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading settings">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {[5, 3, 2].map((rows, i) => (
        <div key={i} className="flex flex-col rounded-xl border bg-card">
          <div className="flex items-center gap-3 p-5">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
          </div>
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="grid gap-3 border-t p-5 md:grid-cols-[15rem_1fr] md:gap-8">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

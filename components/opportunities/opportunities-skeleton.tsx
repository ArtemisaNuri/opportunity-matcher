import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** First-hydration skeleton mirroring the Opportunities page layout. */
export function OpportunitiesSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading opportunities">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2.5 rounded-lg border px-3 py-2.5 last:col-span-2 sm:last:col-span-1">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top matches */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4 [&:nth-child(3)]:hidden lg:[&:nth-child(3)]:flex">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex justify-between border-t pt-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-64 max-w-full rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
        </div>
        <div className="flex h-10 items-center gap-6 border-b bg-muted/40 px-4 sm:px-5">
          {[28, 12, 12, 16, 10, 10, 16].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 border-b px-4 py-3 last:border-0 sm:px-5" style={{ opacity: 1 - i * 0.12 }}>
            <div className="flex w-[28%] flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-[12%] rounded-md" />
            <Skeleton className="h-4 w-[12%]" />
            <Skeleton className="h-4 w-[16%]" />
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-[16%] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

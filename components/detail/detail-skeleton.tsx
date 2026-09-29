import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** First-hydration skeleton mirroring the Opportunity detail layout. */
export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading opportunity">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-72 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="size-[72px] rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Two halves */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-5 lg:col-span-5">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              {i === 1 ? <Skeleton className="h-2.5 w-full rounded-full" /> : null}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-7 w-48 rounded-lg" />
            </div>
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Smart Scoring */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

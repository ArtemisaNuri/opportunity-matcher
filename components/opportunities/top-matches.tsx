"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRightIcon, CalendarIcon, ClockIcon, TargetIcon } from "lucide-react";
import type { Opportunity } from "@/lib/domain/types";
import { formatDate } from "@/lib/dates";
import { SpotlightCard } from "@/components/effects/spotlight-card";
import { ScoreRing } from "@/components/scoring/score-ring";
import { StageBadge } from "@/components/scoring/badges";
import { Button } from "@/components/ui/button";

/** Spotlight row of up to three current Top Matches. */
export function TopMatches({
  matches,
  onShowAll,
}: {
  /** Top Match opportunities, already in best-match order. */
  matches: Opportunity[];
  onShowAll: () => void;
}) {
  const shown = matches.slice(0, 3);
  return (
    <section aria-labelledby="top-matches-heading" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="top-matches-heading" className="text-sm font-semibold">
            Top matches
          </h2>
          <p className="text-xs text-muted-foreground">Great fit, and the team has room to take them on.</p>
        </div>
        {matches.length > 3 ? (
          <Button variant="ghost" size="sm" onClick={onShowAll} className="text-muted-foreground">
            View all {matches.length} <ArrowRightIcon aria-hidden />
          </Button>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <TargetIcon className="size-4" aria-hidden />
          </span>
          <p>
            <span className="font-medium text-foreground">No Top Matches right now.</span> Score new opportunities to
            find work that fits the team&apos;s capacity.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((o, i) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <TopMatchCard opportunity={o} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function TopMatchCard({ opportunity: o }: { opportunity: Opportunity }) {
  const result = o.scoring.result!;
  const excerpt = result.summary || o.profile;
  return (
    <SpotlightCard className="h-full">
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <ScoreRing value={result.total} category={result.category} size={48} className="text-sm" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="truncate text-sm font-semibold" title={o.title}>
              {o.title}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {o.client} <span aria-hidden>·</span> {o.sector}
            </p>
          </div>
          <StageBadge stage={o.stage} className="shrink-0" />
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{excerpt}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs">
          <div className="flex min-w-0 items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <CalendarIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Starts</span>
              {formatDate(o.requirements.preferredStart)}
            </span>
            <span className="hidden items-center gap-1 whitespace-nowrap xl:inline-flex">
              <ClockIcon className="size-3.5" aria-hidden />
              <span className="tabular">{o.requirements.hoursPerWeek}</span> h/wk
            </span>
          </div>
          <Link
            href={`/opportunities/${o.id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            View analysis <ArrowRightIcon className="size-3.5" aria-hidden />
            <span className="sr-only">for {o.title}</span>
          </Link>
        </div>
      </div>
    </SpotlightCard>
  );
}

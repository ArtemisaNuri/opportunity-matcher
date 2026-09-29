"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeftIcon } from "lucide-react";
import type { Opportunity } from "@/lib/domain/types";
import { opportunityWindow } from "@/lib/capacity";
import { useAppState, useOpportunity } from "@/lib/store/react";
import { GlowBackdrop } from "@/components/effects/glow-backdrop";
import { EmptyState } from "@/components/effects/empty-state";
import { Button } from "@/components/ui/button";
import { ProjectComparisonCard } from "@/components/charts/project-comparison-card";
import { TeamCapacityCard } from "@/components/team/team-capacity-card";
import { TeamHeatmapCard } from "@/components/team/team-heatmap-card";
import { DetailSkeleton } from "@/components/detail/detail-skeleton";
import { DetailHeader } from "@/components/detail/detail-header";
import { OpportunityDetailsPanel } from "@/components/detail/opportunity-details-panel";
import { SmartScoringSection } from "@/components/detail/smart-scoring-section";

export function OpportunityDetailView() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const hydrated = useAppState((s) => s.hydrated);
  const opportunity = useOpportunity(id);
  // Set while a delete navigates away, so the page doesn't flash "not found".
  const [leaving, setLeaving] = React.useState(false);

  let body: React.ReactNode;
  if (!hydrated || leaving) body = <DetailSkeleton />;
  else if (!opportunity)
    body = (
      <div className="rounded-xl border bg-card">
        <EmptyState
          title="Opportunity not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeftIcon aria-hidden />
                Back to opportunities
              </Link>
            </Button>
          }
        />
      </div>
    );
  else body = <DetailContent opportunity={opportunity} onDeleted={() => setLeaving(true)} />;

  return (
    <>
      <GlowBackdrop />
      <div className="mx-auto w-full max-w-7xl">{body}</div>
    </>
  );
}

function Reveal({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function DetailContent({ opportunity, onDeleted }: { opportunity: Opportunity; onDeleted: () => void }) {
  const settings = useAppState((s) => s.settings);
  const windowStart = opportunityWindow(opportunity).start;

  return (
    <div className="flex flex-col gap-6">
      <Reveal index={0}>
        <DetailHeader opportunity={opportunity} onDeleted={onDeleted} />
      </Reveal>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Reveal index={1} className="min-w-0 rounded-xl lg:sticky lg:top-20 lg:col-span-5 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:thin]">
          <OpportunityDetailsPanel opportunity={opportunity} settings={settings} />
        </Reveal>

        <Reveal index={2} className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <section aria-labelledby="internal-heading" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="internal-heading" className="text-base font-semibold">
                Internal state
              </h2>
              <p className="text-xs text-muted-foreground">Team load and committed projects around this window</p>
            </div>
            <ProjectComparisonCard opportunity={opportunity} />
            <TeamCapacityCard asOf={windowStart} />
            <TeamHeatmapCard opportunity={opportunity} />
          </section>
        </Reveal>
      </div>

      <Reveal index={3}>
        <SmartScoringSection opportunity={opportunity} />
      </Reveal>
    </div>
  );
}

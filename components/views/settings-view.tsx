"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useAppState } from "@/lib/store/react";
import { PageHeader } from "@/components/shell/page-header";
import { ScoringRulesCard } from "@/components/settings/scoring-rules-card";
import { HowScoringWorksCard } from "@/components/settings/how-scoring-works-card";
import { DemoDataCard, StaleScoresCard } from "@/components/settings/data-cards";
import { SettingsSkeleton } from "@/components/settings/settings-card";

export function SettingsView() {
  const hydrated = useAppState((s) => s.hydrated);
  return <div className="mx-auto w-full max-w-4xl">{hydrated ? <SettingsContent /> : <SettingsSkeleton />}</div>;
}

function Reveal({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SettingsContent() {
  const gateRatio = useAppState((s) => s.settings.capacityGateRatio);
  return (
    <div className="flex flex-col gap-6">
      <Reveal index={0}>
        <PageHeader
          title="Settings"
          description="Tune the rules Smart Scoring applies to every opportunity. Changes mark existing scores as stale until they're re-scored."
        />
      </Reveal>
      <StaleScoresCard />
      <Reveal index={1}>
        <ScoringRulesCard />
      </Reveal>
      <Reveal index={2}>
        <HowScoringWorksCard gateRatio={gateRatio} />
      </Reveal>
      <Reveal index={3}>
        <DemoDataCard />
      </Reveal>
    </div>
  );
}

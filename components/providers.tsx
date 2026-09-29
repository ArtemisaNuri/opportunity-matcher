"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { toast } from "sonner";
import { AppStoreProvider, useAppStore } from "@/lib/store/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { OpportunitySheetProvider } from "@/components/opportunities/opportunity-sheet-context";
import { CATEGORY_LABEL } from "@/lib/domain/types";

function ScoreToasts() {
  const store = useAppStore();
  React.useEffect(
    () =>
      store.onScoreComplete(({ opportunity, result }) => {
        toast.success(`${opportunity.title} → ${CATEGORY_LABEL[result.category]} · ${result.total}`, {
          description: opportunity.client,
        });
      }),
    [store],
  );
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <AppStoreProvider>
            <OpportunitySheetProvider>
              {children}
              <ScoreToasts />
              <Toaster />
            </OpportunitySheetProvider>
          </AppStoreProvider>
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}

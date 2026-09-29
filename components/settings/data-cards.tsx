"use client";

import * as React from "react";
import { toast } from "sonner";
import { DatabaseIcon, LoaderCircleIcon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";
import { useAppState, useAppStore } from "@/lib/store/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsCard } from "@/components/settings/settings-card";

/** Banner shown while any score was produced under older settings or inputs. */
export function StaleScoresCard() {
  const store = useAppStore();
  const opportunities = useAppState((s) => s.opportunities);
  const stale = React.useMemo(() => opportunities.filter((o) => o.scoring.stale), [opportunities]);
  const waiting = stale.filter((o) => o.scoring.status === "queued" || o.scoring.status === "scoring").length;
  if (stale.length === 0) return null;
  const allQueued = waiting === stale.length;
  return (
    <div
      role="status"
      className="flex animate-fade-up flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <RefreshCwIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">
            <span className="tabular">{stale.length}</span> score{stale.length === 1 ? " uses" : "s use"} old settings
          </p>
          <p className="text-sm text-muted-foreground">
            {allQueued
              ? "Re-scoring in the background. You can leave this page."
              : "Rules or inputs changed since they were scored. Re-score to bring them up to date."}
          </p>
        </div>
      </div>
      <Button onClick={() => store.rescoreStale()} disabled={allQueued} className="self-start sm:self-center">
        {allQueued ? <LoaderCircleIcon className="animate-spin" aria-hidden /> : <RefreshCwIcon aria-hidden />}
        {allQueued ? "Re-scoring…" : "Re-score all"}
      </Button>
    </div>
  );
}

export function DemoDataCard() {
  const store = useAppStore();
  const [open, setOpen] = React.useState(false);
  const reset = () => {
    store.resetDemoData();
    setOpen(false);
    toast.success("Demo data restored", { description: "Opportunities, team, projects and settings are back to the sample data." });
  };
  return (
    <SettingsCard
      id="demo"
      icon={DatabaseIcon}
      title="Demo data"
      description="Data is stored in this browser."
    >
      <div className="flex flex-col gap-3 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-lg text-sm text-muted-foreground">
          Restore the sample opportunities, team, projects and default settings. Anything you added or changed here is
          removed.
        </p>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="self-start border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-center"
        >
          <RotateCcwIcon aria-hidden />
          Reset demo data
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>
              This replaces everything stored in this browser with the original sample data, including your settings.
              It can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={reset}>
              <RotateCcwIcon aria-hidden />
              Reset data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsCard>
  );
}

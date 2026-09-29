"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import type { Opportunity } from "@/lib/domain/types";
import { isRestrictedSector } from "@/lib/scoring/engine";
import { useAppState, useAppStore } from "@/lib/store/react";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/scoring/score-ring";
import { ScoringStatePill } from "@/components/scoring/category-pill";
import { SectorBadge, StageBadge } from "@/components/scoring/badges";
import { useOpportunitySheet } from "@/components/opportunities/opportunity-sheet-context";

export function DetailHeader({ opportunity, onDeleted }: { opportunity: Opportunity; onDeleted: () => void }) {
  const store = useAppStore();
  const router = useRouter();
  const { openSheet } = useOpportunitySheet();
  const settings = useAppState((s) => s.settings);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { id, title, client, sector, stage, scoring, createdAt } = opportunity;
  const restricted = isRestrictedSector(sector, settings.restrictedSectors);
  const busy = scoring.status === "queued" || scoring.status === "scoring";
  const result = scoring.status === "scored" ? scoring.result : undefined;
  const hasResult = Boolean(scoring.result);

  const onDelete = () => {
    setConfirmOpen(false);
    onDeleted();
    store.deleteOpportunity(id);
    toast.success(`Deleted “${title}”`);
    router.push("/");
  };

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Opportunities
      </Link>

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">{title}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
            <span className="font-medium text-foreground/90">{client}</span>
            <span aria-hidden className="text-muted-foreground/60">
              ·
            </span>
            <SectorBadge sector={sector} restricted={restricted} className={restricted ? undefined : "border px-2"} />
            <StageBadge stage={stage} />
          </div>
          <p className="text-xs text-muted-foreground">
            Added {formatRelative(createdAt)}
            {scoring.scoredAt && hasResult ? <> · Scored {formatRelative(scoring.scoredAt)}</> : null}
            {!hasResult ? " · Not scored yet" : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:flex-nowrap md:justify-end">
          {result ? (
            <div className="flex items-center gap-3">
              <ScoreRing value={result.total} category={result.category} size={72} className="text-xl" />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Match score</span>
                <ScoringStatePill opportunity={opportunity} />
              </div>
            </div>
          ) : (
            <ScoringStatePill opportunity={opportunity} />
          )}

          <div className="flex items-center gap-2">
            <Button
              variant={hasResult ? "outline" : "default"}
              onClick={() => store.enqueue([id])}
              disabled={busy}
              aria-label={hasResult ? "Re-score this opportunity" : "Score this opportunity now"}
            >
              {hasResult ? (
                <RefreshCwIcon className={busy ? "animate-spin" : undefined} aria-hidden />
              ) : (
                <SparklesIcon aria-hidden />
              )}
              {busy ? (scoring.status === "queued" ? "Queued" : "Scoring…") : hasResult ? "Re-score" : "Score now"}
            </Button>
            <Button variant="outline" onClick={() => openSheet(id)}>
              <PencilIcon aria-hidden />
              Edit
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontalIcon aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
                  <Trash2Icon aria-hidden />
                  Delete opportunity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this opportunity?</DialogTitle>
            <DialogDescription>
              “{title}” from {client} and its analysis will be removed from this browser. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2Icon aria-hidden />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

import * as React from "react";
import { ShieldAlertIcon } from "lucide-react";
import { STAGE_LABEL, type ProjectStage } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function StageBadge({ stage, className }: { stage: ProjectStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center rounded-md border bg-muted/60 px-2 text-xs font-medium text-foreground/80",
        className,
      )}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function SectorBadge({ sector, restricted, className }: { sector: string; restricted: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1 rounded-md px-2 text-xs font-medium",
        restricted ? "bg-cat-bad-soft text-cat-bad ring-1 ring-cat-bad/30 ring-inset" : "text-muted-foreground",
        className,
      )}
      title={restricted ? "Restricted sector: always a Bad Match" : undefined}
    >
      {restricted ? <ShieldAlertIcon className="size-3.5" /> : null}
      {sector}
      {restricted ? <span className="sr-only"> (restricted sector)</span> : null}
    </span>
  );
}

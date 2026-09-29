import * as React from "react";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-primary to-fuchsia-600 text-white shadow-md shadow-primary/30">
        <SparklesIcon className="size-4" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">Opportunity Matcher</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">Internyl</span>
      </div>
    </div>
  );
}

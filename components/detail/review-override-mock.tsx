import * as React from "react";
import { LockIcon } from "lucide-react";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/domain/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/** Static, clearly-labeled placeholder: manual review is parked for a later cycle. */
export function ReviewOverrideMock() {
  return (
    <section
      aria-labelledby="review-heading"
      className="flex flex-col gap-4 rounded-lg border border-dashed bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="review-heading" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <LockIcon className="size-3.5" aria-hidden />
          Review &amp; override
        </h3>
        <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
      <fieldset disabled className="grid gap-3 opacity-70 sm:grid-cols-[14rem_1fr]" aria-describedby="review-caption">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="override-category" className="text-xs text-muted-foreground">
            Override category
          </Label>
          <Select disabled>
            <SelectTrigger id="override-category" aria-label="Override category">
              <SelectValue placeholder="Keep engine result" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reviewer-note" className="text-xs text-muted-foreground">
            Reviewer note
          </Label>
          <Textarea id="reviewer-note" disabled placeholder="Why the team agrees or disagrees with this result…" className="min-h-9 resize-none" rows={1} />
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="review-caption" className="text-xs text-muted-foreground">
          Manual review is parked for a later cycle.
        </p>
        <Button size="sm" variant="outline" disabled>
          Save review
        </Button>
      </div>
    </section>
  );
}

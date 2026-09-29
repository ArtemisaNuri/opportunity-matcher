import * as React from "react";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import type { MonthConflict } from "@/lib/domain/types";
import { formatMonth } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { plural } from "@/components/detail/shared";

/** Exactly the engine's overloaded months: the same months the Project Comparison chart shades. */
export function CapacityConflicts({ conflicts, monthCount }: { conflicts: MonthConflict[]; monthCount: number }) {
  if (conflicts.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-good/10 px-3 py-2.5 text-sm text-good">
        <CircleCheckIcon className="size-4 shrink-0" aria-hidden />
        <span>
          No capacity conflicts across {plural(monthCount, "delivery month")}.
        </span>
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Capacity</TableHead>
            <TableHead className="text-right">Existing work</TableHead>
            <TableHead className="text-right">This opportunity</TableHead>
            <TableHead className="text-right">Over by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conflicts.map((c) => (
            <TableRow key={c.month}>
              <TableCell className="font-medium">{formatMonth(c.month, "long")}</TableCell>
              <TableCell className="text-right tabular">{formatHours(c.capacityHours)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular">{formatHours(c.existingHours)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular">
                {formatHours(c.opportunityHours)}
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center gap-1 font-semibold text-critical tabular">
                  <TriangleAlertIcon className="size-3.5" aria-hidden />+{formatHours(c.overBy)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

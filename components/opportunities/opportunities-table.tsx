"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRightIcon,
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type MatchCategory,
  type Opportunity,
  type Settings,
} from "@/lib/domain/types";
import { compareBestMatch } from "@/lib/domain/sort";
import { ANALYSIS_STAGES, type QueueState } from "@/lib/store/app-store";
import { useAppStore } from "@/lib/store/react";
import { isRestrictedSector } from "@/lib/scoring/engine";
import { CATEGORY_CLASSES } from "@/lib/palette";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/effects/border-beam";
import { ShimmerText } from "@/components/effects/shimmer-text";
import { ScoreRing } from "@/components/scoring/score-ring";
import { ScoringStatePill } from "@/components/scoring/category-pill";
import { SectorBadge, StageBadge } from "@/components/scoring/badges";
import { useOpportunitySheet } from "@/components/opportunities/opportunity-sheet-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

// ------------------------------------------------------------------ filtering & sorting

export type SortKey = "title" | "budget" | "cost" | "start" | "score";
export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}
export interface TableFilters {
  search: string;
  categories: MatchCategory[];
  topOnly: boolean;
}

export const EMPTY_FILTERS: TableFilters = { search: "", categories: [], topOnly: false };

export function hasActiveFilters(f: TableFilters): boolean {
  return f.search.trim() !== "" || f.categories.length > 0 || f.topOnly;
}

/** First click direction per column; the second flips it, the third returns to best match. */
const FIRST_DIR: Record<SortKey, SortState["dir"]> = {
  title: "asc",
  start: "asc",
  budget: "desc",
  cost: "desc",
  score: "desc",
};

export function nextSort(current: SortState | null, key: SortKey): SortState | null {
  if (!current || current.key !== key) return { key, dir: FIRST_DIR[key] };
  if (current.dir === FIRST_DIR[key]) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  return null;
}

export function filterAndSort(items: Opportunity[], f: TableFilters, sort: SortState | null): Opportunity[] {
  const q = f.search.trim().toLowerCase();
  const filtered = items.filter((o) => {
    if (q && !`${o.title}\n${o.client}\n${o.sector}`.toLowerCase().includes(q)) return false;
    const cat = o.scoring.result?.category;
    if (f.topOnly && cat !== "top") return false;
    if (f.categories.length > 0 && (!cat || !f.categories.includes(cat))) return false;
    return true;
  });
  if (!sort) return filtered.sort(compareBestMatch);
  const sign = sort.dir === "asc" ? 1 : -1;
  return filtered.sort((a, b) => {
    let d = 0;
    switch (sort.key) {
      case "title":
        d = a.title.localeCompare(b.title, "en", { sensitivity: "base" });
        break;
      case "budget":
        d = a.clientBudget - b.clientBudget;
        break;
      case "cost":
        d = a.costToBuild - b.costToBuild;
        break;
      case "start":
        d = a.requirements.preferredStart.localeCompare(b.requirements.preferredStart);
        break;
      case "score": {
        const sa = a.scoring.result?.total;
        const sb = b.scoring.result?.total;
        // Unscored always sink to the bottom, whatever the direction.
        if (sa === undefined || sb === undefined) {
          if (sa !== undefined) return -1;
          if (sb !== undefined) return 1;
          return compareBestMatch(a, b);
        }
        d = sa - sb;
        break;
      }
    }
    return d !== 0 ? d * sign : compareBestMatch(a, b);
  });
}

// ------------------------------------------------------------------ table

export function OpportunitiesTable({
  rows,
  total,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  settings,
  queue,
  categoryCounts,
}: {
  rows: Opportunity[];
  total: number;
  filters: TableFilters;
  onFiltersChange: (next: TableFilters) => void;
  sort: SortState | null;
  onSortChange: (next: SortState | null) => void;
  settings: Settings;
  queue: QueueState;
  categoryCounts: Record<MatchCategory, number>;
}) {
  const [pendingDelete, setPendingDelete] = React.useState<Opportunity | null>(null);
  const store = useAppStore();
  const filtering = hasActiveFilters(filters);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    store.deleteOpportunity(pendingDelete.id);
    toast.success("Opportunity deleted", { description: pendingDelete.title });
    setPendingDelete(null);
  };

  return (
    <section aria-labelledby="opportunities-table-heading" className="flex flex-col rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="opportunities-table-heading" className="text-sm font-semibold">
            All opportunities
          </h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {filtering ? (
              <>
                Showing <span className="font-medium text-foreground tabular">{rows.length}</span> of{" "}
                <span className="tabular">{total}</span>
              </>
            ) : (
              <>
                <span className="font-medium text-foreground tabular">{total}</span> total
              </>
            )}
            {sort ? null : <span className="hidden sm:inline"> · sorted by best match</span>}
          </p>
        </div>
        <Toolbar filters={filters} onChange={onFiltersChange} counts={categoryCounts} />
      </div>

      <div className="relative w-full overflow-x-auto">
        <table className="w-full min-w-[980px] caption-bottom text-sm">
          <caption className="sr-only">
            Opportunities{sort ? `, sorted by ${sort.key} ${sort.dir === "asc" ? "ascending" : "descending"}` : ", sorted by best match"}
          </caption>
          <thead className="bg-muted/40 [&_tr]:border-b">
            <tr>
              <SortHead label="Opportunity" k="title" sort={sort} onSort={onSortChange} className="pl-4 sm:pl-5" />
              <th className={TH}>Stage</th>
              <SortHead label="Budget" k="budget" sort={sort} onSort={onSortChange} align="right" />
              <SortHead label="Cost to build" k="cost" sort={sort} onSort={onSortChange} align="right" />
              <SortHead label="Start" k="start" sort={sort} onSort={onSortChange} />
              <SortHead label="Score" k="score" sort={sort} onSort={onSortChange} align="center" />
              <th className={TH}>Category</th>
              <th className={cn(TH, "pr-4 text-right sm:pr-5")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((o) => (
                <OpportunityRow
                  key={o.id}
                  opportunity={o}
                  restricted={isRestrictedSector(o.sector, settings.restrictedSectors)}
                  activeStage={queue.activeId === o.id ? queue.activeStage : null}
                  onDelete={() => setPendingDelete(o)}
                />
              ))}
            </AnimatePresence>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <SearchIcon className="size-4" aria-hidden />
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">No opportunities match these filters</p>
                      <p className="text-xs text-muted-foreground">Try a different search or clear the filters.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onFiltersChange(EMPTY_FILTERS)}>
                      <XIcon aria-hidden /> Clear filters
                    </Button>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open: boolean) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this opportunity?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{pendingDelete?.title}</span> and its Opportunity Analysis
              will be removed. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2Icon aria-hidden /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

const TH = "h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground";

function SortHead({
  label,
  k,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  k: SortKey;
  sort: SortState | null;
  onSort: (s: SortState | null) => void;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const active = sort?.key === k;
  const Icon = !active ? ArrowUpDownIcon : sort.dir === "asc" ? ChevronUpIcon : ChevronDownIcon;
  return (
    <th
      className={cn(TH, align === "right" && "text-right", align === "center" && "text-center", className)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(nextSort(sort, k))}
        className={cn(
          "-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
          active && "text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3.5", active ? "text-primary" : "opacity-40")} aria-hidden />
      </button>
    </th>
  );
}

// ------------------------------------------------------------------ toolbar

function Toolbar({
  filters,
  onChange,
  counts,
}: {
  filters: TableFilters;
  onChange: (f: TableFilters) => void;
  counts: Record<MatchCategory, number>;
}) {
  const toggleCategory = (c: MatchCategory, on: boolean) =>
    onChange({
      ...filters,
      categories: on ? CATEGORIES.filter((x) => x === c || filters.categories.includes(x)) : filters.categories.filter((x) => x !== c),
    });
  const catCount = filters.categories.length;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-56 sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search title, client or sector"
          aria-label="Search opportunities"
          className="h-8 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => onChange({ ...filters, search: "" })}
            className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-8", catCount > 0 && "border-primary/40")}>
            <FilterIcon aria-hidden />
            Category
            {catCount > 0 ? (
              <span className="ml-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular">
                {catCount}
              </span>
            ) : null}
            <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Match category</DropdownMenuLabel>
          {CATEGORIES.map((c) => (
            <DropdownMenuCheckboxItem
              key={c}
              checked={filters.categories.includes(c)}
              onCheckedChange={(v: boolean) => toggleCategory(c, Boolean(v))}
              onSelect={(e: Event) => e.preventDefault()}
            >
              <span className={cn("size-2 rounded-full", CATEGORY_CLASSES[c].dot)} aria-hidden />
              <span className="flex-1">{CATEGORY_LABEL[c]}</span>
              <span className="text-xs text-muted-foreground tabular">{counts[c]}</span>
            </DropdownMenuCheckboxItem>
          ))}
          {catCount > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onChange({ ...filters, categories: [] })}>
                <XIcon aria-hidden /> Clear category filter
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex h-8 items-center gap-2 rounded-lg border px-2.5">
        <Switch
          id="top-only"
          checked={filters.topOnly}
          onCheckedChange={(v: boolean) => onChange({ ...filters, topOnly: Boolean(v) })}
        />
        <Label htmlFor="top-only" className="cursor-pointer text-xs font-medium whitespace-nowrap">
          Top matches only
        </Label>
      </div>

      {hasActiveFilters(filters) ? (
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => onChange(EMPTY_FILTERS)}>
          <XIcon aria-hidden /> Clear
        </Button>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ row

function OpportunityRow({
  opportunity: o,
  restricted,
  activeStage,
  onDelete,
}: {
  opportunity: Opportunity;
  restricted: boolean;
  /** Stage index when this row is the one being scored. */
  activeStage: number | null;
  onDelete: () => void;
}) {
  const router = useRouter();
  const store = useAppStore();
  const { openSheet } = useOpportunitySheet();
  const { status, result, stale } = o.scoring;
  const scoring = status === "scoring" || activeStage !== null;
  const queued = status === "queued" && !scoring;
  const href = `/opportunities/${o.id}`;
  const stage = activeStage ?? 0;

  const onRowClick = () => {
    if (typeof window !== "undefined" && window.getSelection()?.toString()) return;
    router.push(href);
  };

  const scoreLabel =
    status === "error" ? "Retry" : status === "unscored" ? "Score" : stale && status === "scored" ? "Re-score" : null;
  const ScoreIcon = status === "error" ? RotateCcwIcon : status === "unscored" ? SparklesIcon : RefreshCwIcon;

  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
      onClick={onRowClick}
      data-state={scoring ? "scoring" : status}
      className={cn(
        "group/row cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50",
        scoring && "bg-primary/[0.045] hover:bg-primary/[0.07]",
      )}
    >
      {/* Opportunity */}
      <td className="relative max-w-[320px] py-3 pr-3 pl-4 align-middle sm:pl-5">
        {scoring ? (
          <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] animate-pulse-soft rounded-r-full bg-primary" />
        ) : null}
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="truncate rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
            title={o.title}
          >
            {o.title}
          </Link>
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{o.client}</span>
            <span aria-hidden>·</span>
            <SectorBadge sector={o.sector} restricted={restricted} className={cn("h-5", !restricted && "px-0")} />
          </div>
        </div>
      </td>

      {/* Stage */}
      <td className="px-3 py-3 align-middle whitespace-nowrap">
        <StageBadge stage={o.stage} />
      </td>

      {/* Budget */}
      <td className="px-3 py-3 text-right align-middle whitespace-nowrap tabular">{formatMoney(o.clientBudget)}</td>

      {/* Cost */}
      <td className="px-3 py-3 text-right align-middle whitespace-nowrap tabular">
        <span className={cn(o.clientBudget < o.costToBuild && "text-warning")}>{formatMoney(o.costToBuild)}</span>
        {o.clientBudget < o.costToBuild ? <span className="sr-only"> (above client budget)</span> : null}
      </td>

      {/* Start */}
      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground tabular">
        {formatDate(o.requirements.preferredStart)}
      </td>

      {/* Score */}
      <td className="px-3 py-2 text-center align-middle">
        <div className="flex justify-center">
          {result && status === "scored" ? (
            <ScoreRing
              value={result.total}
              category={result.category}
              size={36}
              className={cn("text-xs", stale && "opacity-60")}
            />
          ) : scoring ? (
            <span className="relative flex size-9 items-center justify-center rounded-full border bg-card text-[10px] font-medium text-primary tabular">
              <BorderBeam />
              {stage + 1}/{ANALYSIS_STAGES.length}
              <span className="sr-only"> analysis steps</span>
            </span>
          ) : queued ? (
            <span className="flex size-9 animate-pulse-soft items-center justify-center rounded-full border border-dashed text-muted-foreground">
              <ClockIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Queued</span>
            </span>
          ) : (
            <span className="text-muted-foreground" aria-label="Not scored">
              —
            </span>
          )}
        </div>
      </td>

      {/* Category / state */}
      <td className="px-3 py-3 align-middle whitespace-nowrap">
        {scoring ? (
          <div className="flex w-44 flex-col gap-1.5" aria-live="polite">
            <ScoringStatePill opportunity={{ ...o, scoring: { ...o.scoring, status: "scoring" } }} />
            <div className="flex items-center gap-2">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="block h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: `${((stage + 1) / ANALYSIS_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              </span>
            </div>
            <ShimmerText className="truncate text-[11px] font-normal">{ANALYSIS_STAGES[stage]}…</ShimmerText>
          </div>
        ) : (
          <ScoringStatePill opportunity={o} />
        )}
      </td>

      {/* Actions */}
      <td className="py-3 pr-4 pl-3 text-right align-middle whitespace-nowrap sm:pr-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          {scoreLabel ? (
            <Button
              variant={status === "unscored" ? "outline" : "ghost"}
              size="sm"
              className={cn("h-7 px-2.5", status === "error" && "text-destructive hover:text-destructive")}
              onClick={() => store.enqueue([o.id])}
              aria-label={`${scoreLabel} ${o.title}`}
            >
              <ScoreIcon className="size-3.5" aria-hidden />
              {scoreLabel}
            </Button>
          ) : null}
          {/* Non-modal so opening the edit sheet / delete dialog from an item doesn't fight the menu's focus trap. */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground" aria-label={`Actions for ${o.title}`}>
                <MoreHorizontalIcon aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => router.push(href)}>
                <ArrowRightIcon aria-hidden /> View analysis
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSheet(o.id)}>
                <PencilIcon aria-hidden /> Edit
              </DropdownMenuItem>
              {status === "scored" && !stale ? (
                <DropdownMenuItem onSelect={() => store.enqueue([o.id])}>
                  <RefreshCwIcon aria-hidden /> Re-score
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2Icon aria-hidden /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </motion.tr>
  );
}

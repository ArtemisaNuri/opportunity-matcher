import { CATEGORY_RANK, type Opportunity } from "@/lib/domain/types";

/** "Best match" order: scored by category rank then score; unscored last (newest first). */
export function compareBestMatch(a: Opportunity, b: Opportunity): number {
  const ra = a.scoring.result;
  const rb = b.scoring.result;
  if (ra && rb) {
    const byCat = CATEGORY_RANK[ra.category] - CATEGORY_RANK[rb.category];
    if (byCat !== 0) return byCat;
    if (rb.total !== ra.total) return rb.total - ra.total;
  } else if (ra) return -1;
  else if (rb) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

export function sortBestMatch(items: Opportunity[]): Opportunity[] {
  return [...items].sort(compareBestMatch);
}

import { buildSeed } from "@/lib/data/seed";
import { scoreOpportunity } from "@/lib/scoring/engine";
import { teamCapacityByMonth, totalDemandByMonth, memberLoadByMonth } from "@/lib/capacity";
import { monthRange, todayISO } from "@/lib/dates";
const s = buildSeed(new Date("2026-09-25T10:00:00Z"));
const months = monthRange(todayISO(new Date("2026-09-25T10:00:00Z")), 12);
const cap = teamCapacityByMonth(s.members, months), dem = totalDemandByMonth(s.projects, months);
console.log(months.map(m => `${m}: ${Math.round(dem[m]/cap[m]*100)}%`).join("  "));
for (const mem of s.members) console.log(mem.name.padEnd(14), memberLoadByMonth(mem, s.projects, months).map(l => String(l.utilization).padStart(4)).join(""));
const ctx = { members: s.members, projects: s.projects, settings: s.settings, today: "2026-09-25" };
for (const o of s.opportunities) { const r = scoreOpportunity(o, ctx); console.log(o.title.padEnd(28), r.total, r.category.padEnd(9), r.factors.map(f=>`${f.key}:${f.score}`).join(" "), "| gate", r.capacityGate.fitRatio, r.conflicts.map(c=>c.month).join(","), r.suggestion?.weeks ?? ""); }
console.log(scoreOpportunity(s.opportunities[1], ctx).summary);
console.log(scoreOpportunity(s.opportunities[1], ctx).suggestion);

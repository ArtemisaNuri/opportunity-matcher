# PR · Opportunity Matcher v1: Smart Scoring MVP

`blast/9-24-2026-opportunity-scoring-mvp` → `main` · cycle file: [9-24-2026-opportunity-scoring-mvp.md](./9-24-2026-opportunity-scoring-mvp.md)

## What this is
A frontend-only Next.js app that scores incoming client opportunities against Internyl's real team capacity and project load, and sorts them into Top / Queued / Backup / Deferred / Bad matches, with a full explanation for every score.

## Buckets (from the workshop + manual notes)
- **19 hard decisions:** the table-first flow, the two-half detail screen, the opportunity fields, healthcare restricted, one toggleable comparison chart, the capacity table + heatmap, a deterministic score → category, the evaluation UI mocked, and the stack/visual brief.
- **12 hard actions:** all built (below).
- **10 unresolved items:** all resolved at Gate 1 (see the answers log). One new tentative item was raised during the build (Queued reachability).

## Decisions logged
- `decisions/9-24-2026-match-scoring-model.md`: weights, budget bands, the capacity gate, category mapping
- `decisions/9-24-2026-ui-component-stack.md`: shadcn/ui + Aceternity-style effects (selective) + Recharts + Motion + Lucide
- `decisions/9-24-2026-deterministic-scoring-engine.md`: no LLM in v1; "Smart Scoring" copy
- `decisions/9-24-2026-heatmap-darker-is-busier.md`
- `decisions/9-24-2026-browser-persistence-behind-repository.md`
- `decisions/9-24-2026-stage-factor-is-project-stage.md`

## One-way doors
New dependencies (the UI stack) and the AI integration choice were both approved at Gate 1 (Q5, Q6). Nothing else was triggered.

## Blocks built
- **Scoring engine** (`lib/scoring`): six factors, each with a sub-score and a note; the capacity gate; the restricted override; the summary; a start-shift suggestion. Pure, deterministic, behind a `Scorer` interface.
- **Capacity math** (`lib/capacity`) and **chart data shaping** (`lib/charts`); chart overload months are tested equal to the engine's conflicts.
- **Persistence:** a repository layer over localStorage (validated, versioned, reset to seed). The seed is anchored to today.
- **Background scoring queue:** FIFO, a staged "Opportunity Analysis", survives navigation, resumes after refresh, and drives a header indicator + toasts.
- **Opportunities:** KPI/distribution strip (filters the table), top-match spotlight, a best-match-sorted table with live scoring states and animated re-sorting, and the Add/Edit sheet with validation and Save & Score Now.
- **Opportunity detail:** details on the left (sticky); on the right, the Project comparison (Existing/Top/Queued/Backup × Area/Gantt × Current/With opportunity), Team capacity (by member/by project) and Team availability heatmap (3/6/12 mo, darker = busier, delivery window outlined). Below: Smart Scoring with every state, "Why this score?" (factor bars, conflicts table, +/− factors, improvement tips, Apply new start date), and a mocked Review & override.
- **Team**, **Projects**, and **Settings** (scoring rules with live bands, stale re-score, reset demo data).
- **Design system:** purple primary, light/dark tokens, a validated colorblind-safe chart palette, skeletons everywhere, motion honouring reduced-motion, usable at 375px.

## Adversarial pass
10 findings; 9 fixed with regression tests where logic was involved (reset/queue race, chart-vs-engine window, corrupt storage, fixed budget bands, …). 3 small scoring refinements are kept and documented in spec §3. See the cycle file.

## ⚠️ Verify on first install
This cycle was built with the package registries blocked. Verified: 38 unit tests, strict type-check of all app code (against stubs), and a real-CSS Chromium preview of every screen in both themes. **Not yet verified:** `npm install` resolution, `next build`, and the real Radix/Recharts/motion rendering, especially the workload area chart (`components/charts/workload-area-chart.tsx`), which rendered as a placeholder in the preview.

## Schema / migrations
None (no database).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01MnzQoB4aF91GTVkesDopb9

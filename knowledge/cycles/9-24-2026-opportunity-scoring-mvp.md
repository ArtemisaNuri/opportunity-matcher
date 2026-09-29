# Cycle — 9-24-2026 · Opportunity Scoring MVP

- **Setup:** single-repo blast (fresh repo `opportunity-matcher`)
- **Branch:** `blast/9-24-2026-opportunity-scoring-mvp`
- **New inputs:**
  - `knowledge/meetings/9-24-2026-opportunity-scoring-workshop.md` (Joel, Artemisa, Gerti)
  - `knowledge/resources/communications/9-24-2026-manual-notes-and-build-specs.md` (manual notes and stack/design specs)
- **Overrides:** none declared
- **Source precedence:** where the meeting and the manual notes disagree, the manual notes are treated as the later, more considered source. Every conflict is still surfaced below.
- **Status:** Gate 1 cleared · Phase 2 done · Phase 3 spec → `docs/product-spec.md`

---

## Bucket 1 — Hard decisions

| # | Decision | Source |
|---|---|---|
| D1 | Purpose: score incoming opportunities and match them against Internyl's internal state (team capacity, project load) to pick which ones to pursue. | Meeting §1; notes "Purpose" |
| D2 | This pass is UI-focused. No backend, database, or auth. | Meeting §8, transcript |
| D3 | The main screen is an Opportunities table (structured, Notion-like, not a heavy CRM), sorted by best match; clicking a row opens the detail screen. | Meeting §2; notes |
| D4 | Add Opportunity happens in a slideout/modal (title + details) with a **Score Now** option. Unscored rows get a **Score** action in a table column. | Notes, Lifecycle 1 |
| D5 | Detail screen: first half is opportunity details, second half is internal data, and the scoring section sits below them. | Meeting §5; notes, Lifecycle 2–3 |
| D6 | Opportunity evaluation fields: project profile, project stage (**Full Build / Prototype / Recovery**), project size / cost to build (Internyl's own estimate, distinct from the client's budget), timeline / milestone dates, client budget, and sector (checked against restricted sectors). | Meeting §3; notes |
| D7 | **Healthcare** is a restricted sector (HIPAA). | Meeting §3 |
| D8 | Internal data objects: team members + capacity (current hrs/wk, open hrs/wk); existing projects + launch/milestone dates. | Meeting §4; notes |
| D9 | One **Project Comparison Chart** with a set toggle (Existing / Top Match / Queued / Backup) instead of many charts, with two display modes: area chart (projects as colored fills, the opportunity overlaid) and simple Gantt. | Meeting §4c; notes |
| D10 | **Team Capacity** chart with a toggle: (a) by capacity (members as rows; current/open hrs/wk), (b) grouped by project, including members not on any project. | Meeting §4b; notes |
| D11 | **Team Heatmap**: cell-based; X = months, Y = team members; hover tooltip shows exact hours worked and available. | Notes; meeting §4b (axis logic settled by the notes) |
| D12 | Scoring outputs a weighted score (0–100) → a **deterministic** category pill → a brief written explanation of how the opportunity stacks up against internal data. | Meeting §5; notes |
| D13 | Categories: Top Match, Queued Match, Backup Match, Deferred Match, Bad Match. | Notes (exact cutoffs → U1) |
| D14 | No per-person weekly-hours editing interface for now. | Meeting §4b |
| D15 | The detailed evaluation UI (reviewing, second-guessing, or overriding an AI score) stays mocked/static this pass. | Meeting §5, §9 |
| D16 | Design principle: consolidate views behind toggles instead of adding screens/charts. | Meeting §8 |
| D17 | Stack: Next.js + TypeScript + Tailwind CSS, plus a component UI library (which one → U5). | Build specs |
| D18 | Visual: purple primary, light + dark themes, rich charts/visualizations, generous loading animations, professional finish. | Build specs |
| D19 | Scoring runs in the background, and the table can filter to top matches. | Build specs |

## Bucket 2 — Hard actions (to be built this cycle)

| # | Action |
|---|---|
| A1 | Scaffold the Next.js (App Router) + TS + Tailwind app with a purple design system, a light/dark theme toggle, and an app shell (sidebar and header). |
| A2 | Seed a realistic mock dataset: team roster with capacity, existing projects with timelines and assignments, and about 10 opportunities (including 3–4 "live"-style test cases and a healthcare one). |
| A3 | Opportunities table: sort by best match, category pills, a Score column/action for unscored rows, search and category filter, and a "Top matches only" quick filter. |
| A4 | Add Opportunity slideout: all D6 fields, validation, and **Score Now** on save. |
| A5 | Opportunity detail: the opportunity-details panel (first half). |
| A6 | Project Comparison Chart: set toggle, with area and Gantt modes; the opportunity is visibly distinct. |
| A7 | Team Capacity chart: by-capacity and grouped-by-project toggle. |
| A8 | Team Heatmap with a range filter and hover tooltip. |
| A9 | Scoring engine: weighted factors, category mapping, explanation, per-factor breakdown. |
| A10 | Background scoring queue: animated progress, per-row scoring states, re-sorting when scores land, and a "Score all unscored" action. |
| A11 | Loading states everywhere: skeletons, a staged scoring animation, and chart entrance animations. |
| A12 | Dashboard/overview header: KPI tiles (counts per category, team utilization, open hours) and a category distribution visual. |

## Bucket 3 — Unresolved (each has a proposed resolution)

- **U1 · Score thresholds + category names.** The sources conflict: the meeting floated Queued ≈ 70–90 and Deferred ≈ 50–70, while the manual notes say Top/Queued ≥ 90, Backup 80–90, Deferred ≈ 70, Bad < 70. *Proposed:* **Top ≥ 90 with capacity · Queued ≥ 90 without capacity · Backup 80–89 · Deferred 70–79 · Bad < 70** (the manual notes, with the gaps closed).
- **U2 · What "team has capacity" means (splits Top vs Queued).** *Proposed:* capacity is a separate gate as well as a weighted factor. The gate passes when the team's projected open hours, across the opportunity's timeline, cover its required hours/week for at least 80% of its months.
- **U3 · Scoring weights.** *Proposed defaults:* Team capacity 25 · Budget fit (budget vs cost to build) 20 · Timeline feasibility (vs existing launches) 20 · Project profile fit 15 · Stage fit 10 · Size/cost manageability 10. A **restricted sector is a hard override → Bad Match**, whatever the score.
- **U4 · Minimum budget ("too small").** *Proposed:* budget below a floor (**$10k**, adjustable in settings) is heavily penalized, and budget fit also scales with budget ÷ cost to build.
- **U5 · Which "beautiful UI library".** *Proposed:* **shadcn/ui** (Radix primitives + Tailwind, owned in-repo), **Recharts** for charts, **Framer Motion** for animation, **next-themes** for light/dark, and **lucide-react** icons. These are new dependencies and would be Gate 2 items anyway, so they are batched here.
- **U6 · "AI" scoring: real LLM or not.** A real model call means a backend, an API key, and an external service, which contradicts D2 and is a one-way door. *Proposed:* a **deterministic in-browser scoring engine** that also writes the explanation (templated from the factor results), with a simulated "AI analyzing…" staged animation and a clean `Scorer` interface so an LLM can be plugged in later.
- **U7 · Heatmap color direction.** The meeting said darker = more *available*; the manual notes say heavier (busier) months are darker. *Proposed:* **darker = busier** (manual notes), plus the meeting's **3 / 6 / 12-month** range filter.
- **U8 · What the Comparison area chart plots.** *Proposed:* stacked areas of **team hours/week demanded per project per month**, a **team-capacity line** on top, and the opportunity as a highlighted, hatched area, so an overload shows as the stack crossing the line.
- **U9 · "Team Capacity" as an opportunity field.** It is listed under opportunity details, but capacity is internal. *Proposed:* the opportunity carries **estimated hours/week required** and **team size required**, and the capacity match computes against those.
- **U10 · Data persistence.** *Proposed:* seeded mock data, with added or scored opportunities saved to browser storage so a demo survives a refresh. There is no server.

## Recommended to park (→ `knowledge/later.md` on approval)

- AI auto-population of opportunity fields from call transcripts, recordings, or notes (meeting §7).
- The real evaluation/override UI for AI scores (meeting §5, §9).
- Backend, database, auth, and multi-user.
- A per-person weekly-hours editor (meeting §4b).
- A real LLM scorer behind the `Scorer` interface (if U6 is approved as proposed).

## Proposed action items (→ `knowledge/action-items.md` on approval)

- **Internyl owes:** real team roster + hours, real existing projects + launch dates, and the 3–4 live opportunities, to replace the mock data.
- **Internyl owes:** a working build for the team to try, so the heatmap and category logic can be refined in use (meeting §9).

---

## Consolidated question list (answer by number)

1. **U1:** Approve the thresholds Top ≥ 90 + capacity / Queued ≥ 90 without capacity / Backup 80–89 / Deferred 70–79 / Bad < 70?
2. **U2:** Approve the capacity gate (open hours cover the requirement for ≥ 80% of the opportunity's months)?
3. **U3:** Approve the weights 25/20/20/15/10/10, with restricted sector as a hard Bad Match?
4. **U4:** Approve a $10k minimum-budget floor (adjustable)?
5. **U5 (one-way door, new deps):** Approve shadcn/ui + Recharts + Framer Motion + next-themes + lucide-react?
6. **U6 (one-way door, AI integration):** Deterministic scorer + templated explanation now, with the LLM behind an interface later? Or wire a real LLM this cycle (needs an API key and a server route)?
7. **U7:** Heatmap darker = busier, with a 3/6/12-month filter?
8. **U8:** Area chart = stacked hours/week demand per project vs a capacity line, with the opportunity overlaid?
9. **U9:** Opportunity carries hours/week + team size required?
10. **U10:** Mock data + browser persistence, no server?
11. **Parking:** Approve the five parked items above?

Gate 2 one-way doors will be appended here after Phase 3.

## Answers log

### Gate 1 · cleared 9-24-2026 (Joel), all approved with revisions
1. **U1 → approved.** Top ≥90 + capacity · Queued ≥90 without capacity · Backup 80–89 · Deferred 70–79 · Bad <70. Restricted sector → Bad Match always. → `decisions/9-24-2026-match-scoring-model.md`
2. **U2 → approved + extended.** Capacity gate at ≥80% of project months; the UI must show exactly which months are overloaded.
3. **U3 → approved + extended.** Weights 25/20/20/15/10/10. Each factor returns a sub-score **and** a short explanation. The 10-pt factor was written as "Sales stage" → building as project-stage fit, logged in `tentative-decisions.md`.
4. **U4 → revised.** Configurable minimum, default $10k. Bands: <5k→0, 5–10k→5, 10–20k→12, 20–40k→17, 40k+→20.
5. **U5 → revised (one-way door, approved).** shadcn/ui foundation + **Aceternity UI selectively** (cards, loaders, empty states, hover, special sections) + Recharts + Motion + Lucide + Tailwind. The dashboard stays clean and professional, not a landing page. → `decisions/9-24-2026-ui-component-stack.md`
6. **U6 → approved (one-way door).** Deterministic engine; labeled "Smart Scoring / Opportunity Analysis", never claims an AI decided. → `decisions/9-24-2026-deterministic-scoring-engine.md`
7. **U7 → approved + extended.** Darker = busier, five utilization states, 3/6/12-month ranges, tooltip `620 / 680 hours — 91% utilized`. → `decisions/9-24-2026-heatmap-darker-is-busier.md`
8. **U8 → revised.** The area chart answers "what happens to capacity if we accept this?": existing workload, the opportunity's workload, a capacity line, overloaded periods, and a **Current workload | With opportunity** toggle.
9. **U9 → revised.** The opportunity stores required hrs/week, estimated duration, preferred start, team size, roles/skills, and start flexibility.
10. **U10 → approved + extended.** localStorage + **Reset demo data**, behind repository/service abstractions. → `decisions/9-24-2026-browser-persistence-behind-repository.md`
11. **Parking → approved + extended** to 10 items. → `later.md`
- **New requirement: score transparency.** A "Why this score?" view on every result: six sub-scores, capacity conflicts, major +/− factors, and (simple version this cycle) a start-date shift suggestion that would clear capacity conflicts.

### Gate 2 · no open one-way doors
The only triggers (new deps, AI integration) were approved at Gate 1 (Q5, Q6). Nothing else touches live data, external services, or client contracts, so the build proceeds without stopping.

### Environment blocker · 9-24-2026
The npm registry and all package CDNs/mirrors are refused (403) by this workspace's network policy, as are the shadcn and Aceternity registries. Build approach → see Q12.

### Follow-ups · 9-24-2026
12. **Build approach → write it anyway.** The full app is written without installing; the pure scoring/capacity engine is tested here with Node; the UI is type-checked against local stubs only. Joel runs `npm install && npm run dev` locally, and fixes follow.
13. **Stage factor → project stage** (not sales pipeline). → `decisions/9-24-2026-stage-factor-is-project-stage.md`

### Gate 1 answers re-confirmed · 9-25-2026
Joel re-sent the full answer set (`resources/communications/9-25-2026-gate-1-answers.md`). It is identical in substance to the log above, so no changes were needed.

---

## Phase 3 · Spec
The product spec lives in `docs/product-spec.md` (working-product doc; per-block acceptance criteria). Implementation notes on the engine rules were folded back into §3 after the build.

## Phase 4 · Execute (9-25-2026)
- **Environment:** npm/PyPI registries and the shadcn/Aceternity registries are refused (403). Build approach per Q12: write the full app, verify offline. Verification actually achieved:
  - Unit tests with Node's test runner (38 passing): engine, capacity math, repositories, scoring queue, chart data shaping.
  - `dev/typecheck.sh`: strict tsc over all app code, against local stubs for the uninstallable packages.
  - `dev/preview/*`: the real app code bundled with esbuild, the real Tailwind v4 CSS (standalone binary from GitHub releases), and the local React 19.2, rendered in Chromium. Stand-ins are used for Radix, motion and icons, and **Recharts renders as a placeholder**. Every route was screenshotted in light, dark and 375px.
- **Aceternity:** the registry is unreachable, so the effect components (spotlight card, border beam, multi-step loader, shimmer text, count-up, aurora/grid backdrop) are written in-repo in that style (`components/effects`). The Aceternity registry is configured in `components.json` for `npx shadcn add @aceternity/…` later.
- **Built:** in three slices by parallel builders plus the lead: foundation (lead); Opportunities screen + Add/Edit sheet; internal-state charts + Team/Projects; detail page + Smart Scoring + Settings.
- **Seed tuning:** the sample data is anchored to today and tuned so the categories spread across all five (3 Top, 1 Queued, 2 Backup, 1 Deferred, 3 Bad on 9-25-2026).
- **Observation → tentative:** Queued Match is nearly unreachable under the approved model (see `decisions/tentative-decisions.md`).

## Phase 5 · Adversarial review (9-25-2026)
An independent reviewer made 10 findings; 9 were fixed:
1. Reset during an in-flight analysis let the old queue loop score the reset data → generation guard + test.
2. The chart's red months could miss engine conflicts for past or >12-month windows → the chart window now always covers the delivery window + test.
3. Malformed stored data could freeze the app on skeletons → per-record validation, per-field settings sanitising, and a hydrate fallback + test.
4. Budget bands scaled with the minimum (spec: fixed $5k/$20k/$40k edges) → fixed + test; settings copy and tips updated.
5. Detail-header menu → non-modal (Radix pointer-events lock).
6. Start-shift suggestion hidden when the result is stale.
7. Count-up no longer flashes the final value.
8. The scoring indicator is now visible on mobile (compact).
10. "Show all top matches" clears the category filter.

**Consciously left (documented in spec §3):** no-tags profile fit = 7 (neutral); −4 for a past preferred start; the launch-clash penalty is capped at −8 total. The seed's Queued example depends on the date (see the tentative decision).

## Phase 6 · PR
Branch `blast/9-24-2026-opportunity-scoring-mvp` → `main`. There is no remote in this workspace, so the PR description is in `knowledge/cycles/9-24-2026-opportunity-scoring-mvp-pr.md`, and the repo is handed off as an archive.

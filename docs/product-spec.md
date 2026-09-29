# Opportunity Matcher — Product Spec (v1)

Opportunity Matcher scores incoming client opportunities against the team's real capacity and project load, then sorts them into match categories so the right work gets picked first.

**Scope:** frontend only. Data is seeded sample data plus browser persistence behind a repository layer. There is no auth and no server.

---

## 0 · Stack & conventions

- Next.js (App Router) · TypeScript (strict) · Tailwind CSS · shadcn/ui primitives in `components/ui` · Aceternity-style effect components in `components/effects`, used selectively · Recharts · Motion · Lucide · next-themes.
- Purple primary; light and dark themes via CSS variables. Charts use one shared palette in `lib/palette.ts`.
- Folders: `app/` routes · `components/` UI · `lib/domain` types · `lib/scoring` engine (pure, framework-free) · `lib/data` seed + repositories · `lib/store` client state · `lib/capacity` workload math.

**Acceptance criteria**
- [ ] `npm run build` and `npm run typecheck` pass. `npm test` passes the scoring engine tests.
- [ ] The theme toggle switches light/dark with no flash; the choice persists.

---

## 1 · Domain model (`lib/domain`)

```ts
type ProjectStage = "full_build" | "prototype" | "recovery";
type MatchCategory = "top" | "queued" | "backup" | "deferred" | "bad";

interface TeamMember { id; name; role; avatarColor; weeklyHours /* contracted */; skills: string[] }
interface Assignment { memberId; hoursPerWeek; start: ISODate; end: ISODate }
interface Project {    // existing, committed work
  id; name; client; color; stage: ProjectStage;
  start: ISODate; launch: ISODate; milestones: { label; date }[];
  assignments: Assignment[];
}
interface Opportunity {
  id; title; client; sector; profile /* description */; profileTags: string[];
  stage: ProjectStage; clientBudget; costToBuild;
  requirements: {
    hoursPerWeek; durationWeeks; preferredStart: ISODate;
    teamSize; roles: string[]; startFlexibilityWeeks;
  };
  deadline?: ISODate; milestones: { label; date }[];
  createdAt; source: "manual" | "seed";
  scoring: { status: "unscored" | "queued" | "scoring" | "scored" | "error"; result?: ScoreResult; scoredAt? };
}
interface Settings { minBudget /* 10000 */; restrictedSectors /* ["Healthcare"] */; preferredTags: string[]; capacityGateRatio /* 0.8 */; stageFit: Record<ProjectStage, number> }
```

---

## 2 · Capacity math (`lib/capacity`)

- `teamCapacityByMonth(members, months)` gives the team's available hours per month (weekly hours × weeks in month).
- `demandByMonth(projects, months)` gives hours demanded per project per month (assignment hours/week × overlapping weeks).
- `opportunityDemandByMonth(opp, months, startShiftWeeks = 0)` spreads `hoursPerWeek` across the opportunity's delivery window.
- `memberLoadByMonth(member, projects, months)` returns `{ booked, capacity, utilization }` per member per month.
- `utilizationState(u)`: ≤50 Low · ≤75 Healthy · ≤90 Busy · ≤100 Near capacity · >100 Overloaded.

**Acceptance criteria**
- [ ] Unit tested: a partial-month overlap is prorated by days; a zero-capacity month does not divide by zero.

---

## 3 · Scoring engine (`lib/scoring`)

`interface Scorer { score(opp, ctx: { members, projects, settings, today }): ScoreResult }`, implemented by `DeterministicScorer`.

| Factor | Max | Rule |
|---|---|---|
| Team capacity | 25 | 25 × (share of delivery months where existing demand + opportunity demand ≤ capacity). Also yields `overloadedMonths[]` and the gate (`share ≥ capacityGateRatio`). A team size/roles shortfall vs. available people lowers the result by up to 5. |
| Budget vs cost | 20 | Bands on client budget: <$5k 0 · <minBudget 5 · <$20k 12 · <$40k 17 · ≥$40k 20. Only the minimum is configurable; the $5k/$20k/$40k edges are fixed. If budget < costToBuild, −5 (floor 0). |
| Timeline fit | 20 | Weeks to the deadline ÷ required weeks: ≥1.15 → 20 · ≥1 → 16 · ≥0.85 → 10 · ≥0.7 → 5 · else 0 (no deadline = 20). −4 if the preferred start has already passed. −4 per existing launch in the first 4 weeks of delivery (max −8 total). Floor 0. |
| Profile fit | 15 | 15 × (matched `profileTags` ∩ `preferredTags`) / max(1, min(3, tags)), capped. No tags at all → 7 (neutral) rather than 0, so a missing field doesn't read as a bad fit. |
| Stage fit | 10 | `settings.stageFit[stage]` (defaults: full_build 10, prototype 9, recovery 6). |
| Project size | 10 | Effort (hrs/week × weeks) in team-months of total contracted capacity: ≤0.5 → 10 · ≤1.5 → 8 · ≤3 → 6 · ≤6 → 4 · else 2. (Uses effort hours rather than dollars, since there is no blended rate yet; cost to build is shown in the note.) |

- `total = round(sum)`, clamped 0–100.
- Category: a restricted sector → `bad` (flag `restrictedOverride`); ≥90 → `top` if the gate passes, else `queued`; ≥80 `backup`; ≥70 `deferred`; else `bad`.
- Each factor returns `{ key, label, score, max, note, impact: "positive" | "neutral" | "negative" }`.
- `summary` is a 2–3 sentence explanation assembled from the category, the strongest positive, the weakest factor, and capacity conflicts.
- Team capacity also loses up to 5 for staffing: −2 per missing person (members with ≥10 open h/wk at the start) and −2 per required role nobody on the team has.
- `suggestion`: when there are capacity conflicts, try start shifts of +1…+12 weeks (never a start in the past). If the gate fails, report the smallest shift that passes it; if the gate already passes, report the smallest shift with no conflicts at all. It says whether the shift is within `startFlexibilityWeeks` ("Moving the start by 2 weeks clears the November conflict"). The UI hides it when the result is stale.

**Acceptance criteria**
- [ ] Deterministic: the same input always gives the same output.
- [ ] A healthcare opportunity with every other factor at maximum → `bad` with `restrictedOverride`.
- [ ] Score 92 with a failing gate → `queued`; 92 with a passing gate → `top`; boundary cases 90/89/80/79/70/69 map correctly.
- [ ] The budget bands match the table exactly at 4,999 / 5,000 / 9,999 / 10,000 / 19,999 / 20,000 / 39,999 / 40,000.

---

## 4 · Data & persistence (`lib/data`)

- Seed: 8 team members, 5 existing projects spanning the next 12 months, and 10 opportunities (3–4 realistic "live" cases, 1 healthcare, a spread across all categories once scored; some pre-scored, some unscored).
- `OpportunityRepository` / `TeamRepository` / `ProjectRepository` / `SettingsRepository` interfaces with a `LocalStorageAdapter` (versioned key, JSON, schema-version guard; corrupt data falls back to seed). UI code never touches `localStorage` directly.
- **Reset demo data** restores the seed.

**Acceptance criteria**
- [ ] Add an opportunity, then refresh: it persists. Reset restores exactly the seed.
- [ ] No `localStorage` references outside `lib/data/adapters`.

---

## 5 · Background scoring queue (`lib/store/scoring-queue`)

- A FIFO queue processed one at a time, with a staged analysis (≈1.8–2.6 s simulated: "Reading opportunity → Checking capacity → Comparing timelines → Classifying"). Scoring is instant; the delay is presentation only and never blocks the UI.
- Triggers: Score Now on save, Score on a row, **Score all unscored**, and Re-score on the detail page.
- Row states: `unscored` → `queued` (pulse) → `scoring` (animated stage label + progress) → `scored` (score counter animates up; the row slides to its sorted position).
- A global indicator in the header shows "Scoring 2 of 5…" with progress. A toast fires on completion ("Acme Portal → Top Match · 94").

**Acceptance criteria**
- [ ] Queue 5 items: all complete in order; navigating between pages does not cancel the queue.
- [ ] A re-score while queued does not duplicate the entry.

---

## 6 · Screens

### 6.1 App shell
Sidebar (Opportunities · Team · Projects · Settings), header with the scoring indicator and theme toggle, purple accent. Responsive: the sidebar collapses into a sheet below `md`.

### 6.2 Opportunities (`/`)
- **KPI strip:** count per category (clicking one filters to it), team utilization this month, open hours/week, unscored count.
- **Category distribution** visual (segmented bar) and a **"Top matches" spotlight** row of Top Match cards.
- **Table:** Title/client · Sector · Stage · Budget · Cost to build · Start · Score (ring) · Category pill · Action. **Default sort: best match** (category rank, then score, with unscored last). Sortable columns, search, a category filter, a **"Top matches only"** toggle, and **Score all unscored**.
- Loading: a skeleton table on first hydration; an empty state with an illustration and a CTA.

### 6.3 Add Opportunity (Sheet)
Sections: Basics (title, client, sector with a restricted-sector warning, profile + tags) · Project (stage segmented control, client budget, cost to build, deadline, milestones) · Capacity needs (hrs/week, duration, preferred start, team size, roles, flexibility). Validation errors are shown inline. Two buttons: **Save** and **Save & Score Now**. Editing an existing opportunity reuses the sheet.

### 6.4 Opportunity detail (`/opportunities/[id]`)
- **Header:** title, client, category pill, animated score ring, Re-score, Edit.
- **Left half: Opportunity details.** Profile, tags, stage, budget vs cost (mini bar), timeline + milestones, capacity requirements, and the sector (red badge if restricted).
- **Right half: Internal state.**
  1. **Project Comparison** card. Set toggle: Existing · Top Match · Queued · Backup. Display toggle: Area · Gantt. The area mode has a **Current workload | With opportunity** toggle, stacked hours/month per project, a capacity line, overloaded months shaded red, and the opportunity drawn with a hatched purple fill. The Gantt mode shows horizontal bars per project with launch markers, the opportunity bar highlighted, and a "today" line.
  2. **Team Capacity** card. Toggle: By member | By project. By member: rows = members; columns = role, contracted hrs/wk, current hrs/wk, open hrs/wk, and a utilization bar. By project: grouped rows per project plus an "Unassigned" group.
  3. **Team Heatmap** card with a 3/6/12-month toggle: Y = members, X = months, darker = busier, a legend of the 5 states, and a tooltip like `Ana · Nov 2026 — 620 / 680 hours — 91% utilized · Near capacity`. The opportunity's delivery months are outlined.
- **Below: Smart Scoring** section. Unscored: an explainer, a big **Score Now** button, and a staged analysis animation. Scored: the category pill, the score, the summary, and a **"Why this score?"** panel with the 6 factor bars (score/max + note, positive/negative coloring), the capacity conflicts list (overloaded months with hours over), the major +/− factors, and the start-shift suggestion. There is also a static, clearly-labeled "Review & override — coming soon" block (evaluation UI stays mocked).

### 6.5 Team (`/team`) & Projects (`/projects`)
These are read views reusing the Team Capacity table + heatmap and the Gantt (all projects). They are needed so the internal data isn't hidden inside one opportunity.

### 6.6 Settings (`/settings`)
Minimum budget, restricted sectors (tag input), preferred profile tags, stage-fit points, capacity gate %, and **Reset demo data** (confirm dialog). Changing a setting marks scored opportunities "stale" with a one-click re-score all.

**Acceptance criteria (screens)**
- [ ] The table's default order is best match; the Top-only toggle shows just `top`.
- [ ] Save & Score Now: the sheet closes, the row appears as queued, then scores in the background and animates into place.
- [ ] The detail page renders all three internal charts in both themes, and every toggle changes the view.
- [ ] "Why this score?" factor scores sum to the total (before clamping), and overloaded months match the area chart's red periods.
- [ ] Nothing labels the result as AI-made; the copy uses "Smart Scoring / Opportunity Analysis".
- [ ] Every route has a loading skeleton; charts animate on mount; `prefers-reduced-motion` disables the non-essential motion.
- [ ] Usable at 375px width (cards stack, the table scrolls horizontally inside its card).

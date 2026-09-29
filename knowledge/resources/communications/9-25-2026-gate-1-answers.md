Here is the full set again, with **#5 updated to focus on a genuinely beautiful UI component system**.

1. **Score cutoffs.** Use a 0–100 score:

   * **Top Match:** ≥90 and sufficient team capacity
   * **Queued:** ≥90 but insufficient capacity
   * **Backup:** 80–89
   * **Deferred:** 70–79
   * **Bad Match:** <70
   * Any opportunity in a restricted sector is automatically a **Bad Match**, regardless of score.

2. **What “has capacity” means.** Calculate whether the team has enough available hours during the opportunity’s expected delivery period. Consider the team to have capacity when at least **80% of the project months** can support the required workload without exceeding available team capacity. The UI should also show exactly which months are overloaded.

3. **How much each factor counts.**

   * Team capacity: **25 points**
   * Budget vs. cost: **20**
   * Timeline fit: **20**
   * Project profile fit: **15**
   * Sales stage: **10**
   * Project size: **10**

   Each factor should return both a numerical sub-score and a short explanation. Restricted industries override the numerical score and result in Bad Match.

4. **“Budget too small.”** Make the threshold configurable, with **$10,000 as the default minimum viable project budget**. Suggested scoring:

   * `< $5k` → 0/20
   * `$5k–9,999` → 5/20
   * `$10k–19,999` → 12/20
   * `$20k–39,999` → 17/20
   * `$40k+` → 20/20

   Later, this can evolve into margin-based scoring instead of only looking at revenue.

5. **Beautiful UI library.** Use **shadcn/ui as the customizable component foundation**, with **Aceternity UI for visually polished cards, loaders, empty states, interactions, animated elements, and special dashboard sections**. Aceternity currently provides 200+ React/Tailwind/Motion components and blocks and is compatible with shadcn-style projects. ([Aceternity UI][1])

   The stack would be:

   * **shadcn/ui** — base components: dialogs, dropdowns, inputs, tabs, popovers, sheets, tables, etc. It is designed as an open-code foundation that you customize rather than a locked component package. ([shadcn/ui][2])
   * **Aceternity UI** — premium-looking cards, loaders, hover interactions, empty states, sidebars, visual effects and selected animated components. ([Aceternity UI][3])
   * **Recharts** — workload, capacity and scoring charts
   * **Motion / Framer Motion** — custom transitions where necessary
   * **Lucide Icons** — icon system
   * **Tailwind CSS** — overall styling and layout

   I would **not make the entire product look like an animated landing page**. Aceternity should be used selectively. The actual dashboard should remain clean, professional and data-focused.

6. **The “AI” in scoring.** For V1, use a deterministic browser-based scoring engine rather than a real LLM. The flow should be:

   `Opportunity data → scoring engine → factor scores → classification → explanation`

   The interface can show an analyzing/loading interaction, but it should be called something like **Opportunity Analysis** or **Smart Scoring**, rather than claiming that an AI model made the decision. A real AI model can later be added primarily for richer explanations and recommendations.

7. **Heatmap shading.** Use **darker = busier**.

   Suggested utilization states:

   * 0–50% → Low
   * 51–75% → Healthy
   * 76–90% → Busy
   * 91–100% → Near capacity
   * > 100% → Overloaded

   Support **3 / 6 / 12-month** ranges. Hovering a month should show exact numbers such as `620 / 680 hours — 91% utilized`.

8. **Area chart.** The chart should answer: **“What happens to capacity if we accept this opportunity?”**

   Show:

   * existing project workload
   * proposed opportunity workload
   * total team-capacity line
   * overloaded periods where demand crosses available capacity

   Add a toggle such as:

   **Current workload | With opportunity**

9. **“Team capacity” as an opportunity field.** Store more than just team size:

   * Required hours/week
   * Estimated duration
   * Preferred start date
   * Required team size
   * Required roles/skills
   * Start-date flexibility

   Example: `80 hrs/week, 12 weeks, 3 people, 1 senior engineer + 1 engineer + 1 designer, ±2 weeks flexibility`.

10. **Data storage.** For this no-backend iteration:

    * start with realistic sample data
    * store user changes in `localStorage`
    * preserve data after refresh
    * provide a **Reset demo data** option

    Keep persistence behind repository/service abstractions instead of calling `localStorage` directly everywhere, so it can later be replaced with Supabase/Postgres/API calls without rebuilding the UI.

11. **Set aside for a later cycle.**

    * transcript → opportunity extraction
    * actual backend/database
    * authentication
    * RBAC
    * real AI/LLM scoring or explanations
    * manual score override/review flow
    * audit logs
    * per-person hours editor
    * skills-based staffing
    * project margin/profitability calculation

One additional requirement I would add is **score transparency**. Every result should have a **“Why this score?”** view showing the six sub-scores, capacity conflicts, major positive/negative factors, and eventually what changes could improve the opportunity—for example, “moving the start date by two weeks would remove the November capacity conflict.”

[1]: https://ui.aceternity.com/components?utm_source=chatgpt.com "Free React & Next.js UI Components | Aceternity UI"
[2]: https://ui.shadcn.com/?utm_source=chatgpt.com "shadcn/ui - The Foundation for your Design System"
[3]: https://ui.aceternity.com/explore?utm_source=chatgpt.com "Explore Components, Blocks & Templates | Aceternity UI"

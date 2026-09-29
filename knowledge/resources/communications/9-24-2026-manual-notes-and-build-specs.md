# Manual Notes + Build Specifications — 9-24-2026

Source: Joel's written follow-up to the 9-24-2026 workshop, sent with the meeting notes as the kickoff for Blast cycle 1. Recorded verbatim in substance and lightly cleaned up.

## Manual notes

### Opportunities
- Table: sorted by best match (top to bottom).
- Add Opportunity: slideout or modal with title and the opportunity details.

### Lifecycle
1. Add Opportunity (and click **Score Now**) while adding it, or click **Score** from a column in the table for existing opportunities not scored yet.
2. Click into the opportunity:
   1. First half of screen: opportunity details (all the fields outlined below).
   2. Second half of screen: internal details (existing launch dates, team capacity):
      1. **Project Comparison Chart** (two display options). A toggle above it picks the set of projects to compare the opportunity with: Existing Projects, Top Match Projects, Queued Projects, Backup Projects.
         1. Area chart: each existing project has a colored area fill, and the new hypothetical project (the opportunity) is also on it.
         2. Simple Gantt chart of existing project timelines.
      2. **Team capacity chart** (two display options, toggle above it):
         1. Show team by capacity: a table with team members as rows and columns such as current hours/week and open hours/week.
         2. Show team by capacity grouped by project: the same, grouped by existing project.
      3. **Team heatmap chart**: a cell-based heatmap of team member availability over time.
         1. X axis: months (left to right).
         2. Y axis: team members.
         3. Heavier months are darker, more available months are lighter. The hover tooltip shows exact hours worked and availability.
3. Scoring: based on all of the above, AI scores the opportunity and outputs its score, a category pill (Top Match, Queued, etc.), and a brief written explanation of how it stacks up against the internal data.

### Opportunity details (used for evaluation)
- Project Profile
- Team Capacity
- Project Stages: Full Build, Prototype, Recovery
- Project size / cost (to build)
- Project Timeline / Milestone dates
- Client's budget (e.g. too small)
- Restricted Sectors (healthcare companies)

### Data required for matching
- Team members and their capacity
- Existing projects and launch dates

### Match scoring framework
- A weighted score from the opportunity's datapoints, evaluated against the internal state.
- The weighted score maps deterministically to categories:
  - Top Match: 90%, Great, and team has capacity
  - Queued Match: 90%, Great, but not enough capacity
  - Backup Match: 80–90%
  - Deferred Match: 70%, some overlap, not ideal; only if there's extra capacity/ability to do it
  - Bad Match: not a great fit, < 70%

### Purpose
- Score opportunities and match them with our team (selecting the right opportunities).

## Build specifications (from the same message)
- Tech stack: Next.js, TypeScript, Tailwind CSS. For components, use a "beautiful UI library".
- Visual design: purple as the primary color, with light and dark themes.
- Rich diagrams, charts, and UI visualizations to make it friendly.
- Many loading animations.
- A solid background score-matching process that filters out the top matches.
- The notes are the core features; the overall approach should be professional.

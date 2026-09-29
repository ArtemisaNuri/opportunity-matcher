# Development guide

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scoring engine, capacity math, repositories, scoring queue
npm run typecheck
npm run build
```

Data lives in your browser (`localStorage`, key `opportunity-matcher:data`). **Settings → Reset demo data** restores the sample data.

## Architecture

```
app/                     Next.js App Router routes (thin: each renders a client view)
components/
  views/                 One client view per route (opportunities, detail, team, projects, settings)
  opportunities/         Table, KPI strip, Add/Edit sheet, spotlight
  charts/                Project Comparison (Recharts area + custom Gantt)
  team/                  Team Capacity table, Team Heatmap
  scoring/               Category pill, score ring, Smart Scoring section, "Why this score?"
  shell/                 Sidebar, header, scoring indicator, theme toggle
  effects/               Aceternity-style effects (spotlight card, border beam, multi-step loader…), used selectively
  ui/                    shadcn/ui primitives (Radix + Tailwind), owned in-repo
lib/
  domain/                Types, labels, sort order
  capacity/              Workload math (pure)
  scoring/               Deterministic Smart Scoring engine (pure, implements `Scorer`)
  data/                  Seed data, repositories, storage adapters (the ONLY place that touches localStorage)
  store/                 App store + background scoring queue; React bindings
  palette.ts             Chart color roles (CSS variables in app/globals.css)
```

### Rules
- **Data flows one way.** Views read from `useAppState(selector)` / `useScoringContext()` and call store methods (`useAppStore()`). Never read `localStorage` in UI code.
- **Selectors return stable references** (`s => s.opportunities`). Derive with `useMemo`, never inside the selector.
- **Scoring is deterministic** and lives in `lib/scoring`. UI never computes scores itself. Copy says "Smart Scoring" / "Opportunity Analysis", never "AI".
- **Colors come from tokens.** Categories use `CATEGORY_CLASSES` / `CategoryPill`. Chart series use `projectColor(project.colorSlot)` (color follows the entity, never its rank). The opportunity is always `OPPORTUNITY_COLOR` (violet, hatched). The heatmap uses `HEAT_VARS`. Never hard-code hex in components.
- **Color is never the only signal.** Pills carry labels, charts carry legends/tooltips, and overloaded cells carry an icon.
- **Both themes.** Every screen must read well in light and dark. Use semantic classes (`bg-card`, `text-muted-foreground`, `border`).
- **Motion.** Use `motion/react` for enter transitions and count-ups; keep it subtle. `MotionConfig reducedMotion="user"` and the global CSS rule honour `prefers-reduced-motion`.
- **Loading.** Until `hydrated` is true, views render skeletons (`<Skeleton />`, `skeleton-shimmer`).
- **Responsive.** Usable at 375px: grids stack, and wide tables scroll inside their card.

## Offline verification harness (`dev/`)

The environment this was first built in had no package-registry access, so `dev/` contains a harness for checking the app without `npm install`:

- `dev/typecheck.sh` type-checks all app code against loose stubs of the external packages (`dev/types`).
- `dev/preview/build.sh` bundles the real app code with esbuild and compiles the real Tailwind CSS. External packages are replaced by preview stand-ins (`dev/shims`): Radix primitives are simplified, **Recharts charts render as labeled placeholders**, icons are generic glyphs, and motion renders final states.
- `node dev/preview/shoot.mjs <route> <light|dark> <out.png> [w] [h] [--full] [--click "<selector>"]` takes a screenshot.

The harness is not part of the app (`dev/` is excluded from `tsconfig.json`); once dependencies are installed, `npm run dev` is the real thing.

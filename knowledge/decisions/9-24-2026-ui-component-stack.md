# Decision · UI component stack

- **Date:** 9-24-2026 · **Cycle:** [9-24-2026-opportunity-scoring-mvp](../cycles/9-24-2026-opportunity-scoring-mvp.md)
- **Status:** Active · Gate 2 one-way door (new external dependencies), approved at Gate 1 (Q5)

## Decision
- **Next.js (App Router) + TypeScript + Tailwind CSS**: framework and styling.
- **shadcn/ui**: base components (dialogs, sheets, tabs, dropdowns, inputs, tables, popovers), owned in-repo as open code.
- **Aceternity UI**: used *selectively* for polished cards, loaders, empty states, hover interactions, and special dashboard sections. The dashboard itself stays clean and data-focused, not a landing page.
- **Recharts**: workload, capacity, and scoring charts.
- **Motion (Framer Motion)**: custom transitions.
- **Lucide**: icons.
- **next-themes**: light/dark theme. Purple is the primary color.

## Alternatives rejected
- shadcn/ui alone (not visually rich enough for the brief).
- Heavier packaged kits (MUI, Chakra), which would clash with Tailwind and fight the purple theme.
- Aceternity everywhere, which would read as a marketing page rather than a working tool.

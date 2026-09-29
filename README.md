# Opportunity Matcher

Internal Internyl tool that scores incoming client opportunities against the team's real capacity and project load, then sorts them into **Top / Queued / Backup / Deferred / Bad** matches. Every score explains itself.

```bash
npm install
npm run dev      # http://localhost:3000
npm test
```

- **Product spec:** `docs/product-spec.md` · **Dev guide:** `docs/development.md`
- **Stack:** Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui (Radix) · Aceternity-style effects · Recharts · Motion · Lucide
- **Data:** sample data in the browser (localStorage). Reset it in Settings.
- `/knowledge`: the project-management trail (meetings, decisions, cycles). It's not part of the app.

# Decision · Browser persistence behind a repository layer

- **Date:** 9-24-2026 · **Cycle:** [9-24-2026-opportunity-scoring-mvp](../cycles/9-24-2026-opportunity-scoring-mvp.md)
- **Status:** Active

## Decision
No backend this iteration. The app ships with realistic sample data, stores user changes in `localStorage`, keeps them across refreshes, and offers **Reset demo data**. All persistence goes through repository/service interfaces (never direct `localStorage` calls in UI code), so Supabase/Postgres/an API can replace it without rebuilding the UI.

## Alternatives rejected
- A real backend/database now (parked in `later.md`).
- In-memory only (loses the demo on refresh).

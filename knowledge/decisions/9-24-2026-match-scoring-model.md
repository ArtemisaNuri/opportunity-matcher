# Decision · Match scoring model

- **Date:** 9-24-2026 · **Cycle:** [9-24-2026-opportunity-scoring-mvp](../cycles/9-24-2026-opportunity-scoring-mvp.md)
- **Status:** Active

## Decision
Every opportunity gets a 0–100 score built from six factors, each returning a sub-score **and** a one-line explanation:

| Factor | Points |
|---|---|
| Team capacity | 25 |
| Budget vs. cost | 20 |
| Timeline fit | 20 |
| Project profile fit | 15 |
| Stage fit | 10 |
| Project size | 10 |

**Budget bands** (minimum viable budget configurable, default **$10,000**): `<$5k → 0` · `$5k–9,999 → 5` · `$10k–19,999 → 12` · `$20k–39,999 → 17` · `$40k+ → 20`.

**Capacity gate:** the team "has capacity" when, across the opportunity's delivery months, at least **80%** of those months can absorb the required workload without exceeding available team hours. The UI lists exactly which months are overloaded.

**Category mapping (deterministic):**
- Top Match: score ≥ 90 **and** capacity gate passes
- Queued Match: score ≥ 90 **and** capacity gate fails
- Backup Match: 80–89
- Deferred Match: 70–79
- Bad Match: < 70
- A **restricted sector** (default: Healthcare) forces **Bad Match**, whatever the score.

Every result has a **"Why this score?"** view: the six sub-scores, capacity conflicts, and the major positive and negative factors.

## Alternatives rejected
- The meeting's looser ranges (Queued ≈ 70–90, Deferred ≈ 50–70). Replaced by the manual notes' tighter bands, with the gaps closed.
- Capacity as a weighted factor only. Rejected because Top vs. Queued has to split on capacity independently of the score.
- A pure revenue floor for budget. Kept as bands for now; margin-based scoring is parked in `later.md`.

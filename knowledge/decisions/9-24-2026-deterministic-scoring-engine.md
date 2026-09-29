# Decision · Deterministic scoring engine (no LLM in V1)

- **Date:** 9-24-2026 · **Cycle:** [9-24-2026-opportunity-scoring-mvp](../cycles/9-24-2026-opportunity-scoring-mvp.md)
- **Status:** Active · Gate 2 one-way door (AI integration), approved at Gate 1 (Q6)

## Decision
V1 scores in the browser with a deterministic engine:
`Opportunity data → scoring engine → factor scores → classification → explanation`.
The explanation is generated from factor results. The UI may show an analyzing interaction, but it is labeled **Smart Scoring / Opportunity Analysis** and never claims an AI model made the decision. The engine sits behind a `Scorer` interface so a real model can later add richer explanations and recommendations.

## Alternatives rejected
- A real LLM call this cycle. It needs a server, an API key, and an external service, which contradicts the no-backend scope, and it makes scores non-reproducible.

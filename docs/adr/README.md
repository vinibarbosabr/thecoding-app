# docs/adr/

Architecture Decision Records for the **thecoding.pool.near validator app**.

An ADR is a short, dated note recording a significant decision, its context, and its consequences — so future contributors understand *why* the code is the way it is without re-deriving it.

## Files

| ADR | Status | Decision |
| --- | --- | --- |
| [ADR-01](./ADR-01.md) | **Proposed** | Cross-model synthesis (IronClaw vs Grok 4.5): self-custodial no-backend, Vercel v1 / Railway later, TypeScript-now-Rust-later, NEAR Connect, `can_withdraw`-gated unbonding, Vite+React SPA, layered testing + mainnet 0.1-NEAR release gate, UX/QA specifics. Awaiting Vini's approval. |

## Adding a new ADR

1. Pick the next number (`ADR-02`, …).
2. Use this template:

```markdown
# ADR-NN — <title>

**Status:** Proposed
**Date:** YYYY-MM-DD

## Context
Why this decision matters, and what problem it solves.

## Decision
The change or position being taken (be concrete, reference the app).

## Consequences
What gets easier/harder, what we gain, what we MUST NOT do after this.

## Supersedes / References
(link to prior ADRs or PRs)
```

1. PR the new ADR **with** the code change it describes (or flag it for approval in the same workflow).

## Rules

- **One decision per ADR.** If a change involves several independent decisions, split them.
- **Never break a prior decision silently** — if a later ADR contradicts an earlier one, mark the earlier one `Superseded` and link it.
- ADRs are small and intentional. A flood of trivial ADRs becomes noise; reserve them for decisions that would be painful to reverse or re-derive.

Last updated: 2026-08-27.

# Architecture Decision Records

Dated records of decisions that affect how this app talks to
`thecoding.pool.near`. Read these before changing the staking path.

## Index

| ADR | Status | Decision |
| --- | --- | --- |
| [ADR-01](./ADR-01.md) | **Accepted** | Self-custodial v1 UI: user-signed pool calls, no staking backend, NEAR Connect, contract-gated unbonding |

## Adding an ADR

1. Next number (`ADR-02`, …).
2. Template:

```markdown
# ADR-NN — <title>

**Status:** Proposed
**Date:** YYYY-MM-DD

## Context

Why this decision matters.

## Decision

The position, concrete enough to implement or review against.

## Consequences

What becomes easier, harder, or forbidden.

## Supersedes / References
```

3. One decision per ADR. If a later ADR contradicts an Accepted one,
   mark the earlier file **Superseded** and link the new record.
4. Reserve ADRs for choices that change custody, contract calls,
   networks, or what a delegator sees in the wallet. Routine UI
   polish does not need an ADR.

## Status

- **Proposed** — written, not yet the working rule.
- **Accepted** — the working rule.
- **Superseded** — replaced by a newer ADR.

# Architecture Decision Records

Dated records of decisions that affect how this app talks to
`thecoding.pool.near`. Read these before changing the staking path.

## Index

| ADR | Status | Decision |
| --- | --- | --- |
| [ADR-01](./ADR-01.md) | **Accepted** | Self-custodial v1 UI: user-signed pool calls, no staking backend, NEAR Connect, contract-gated unbonding |
| [ADR-02](./ADR-02.md) | **Accepted** | Security posture: no key material in the app's trust boundary — no browser-held keys, static-only hosting, scoped CSP (wallet-sandbox compatible; no script-src), minimal signing-path deps |
| [ADR-03](./ADR-03.md) | **Accepted** | Visual system for the v2 shell: brand tokens, terminal-window panels, availability-driven journey; eth-implicit connect is connector-native (no custom registration code) |
| [ADR-04](./ADR-04.md) | **Accepted** | Metrics, FAQ, and the `#/data` view: epoch APY cell + `~/faq` in the hub, node/network/issuance data on a hash route, RPC + NearBlocks read-only sources, self-collected epoch snapshots as build-time static data, no new dependencies |
| [ADR-05](./ADR-05.md) | **Accepted** | Snapshot publishing: 4 runs/24h (every 6h, off-peak minute), rolling PR created and auto-merged by the workflow, loud failures; amends ADR-04 §4 |

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

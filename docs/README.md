# docs/

Engineering and design documentation for the **thecoding.pool.near validator app**.

> User-facing docs (how to stake/unstake/withdraw) live in the app UI and the repo root `README.md`. This folder is the **engineering / decision** record for contributors.

## Contents

| Path | Purpose |
| --- | --- |
| [`adr/`](./adr/) | **Architecture Decision Records** — one page per significant decision. Read these before changing architecture. |
| [`roadmap.md`](./roadmap.md) | Versioned plan: v1.0.0 (connect/stake/unstake/withdraw) and later Intents, dashboard, points. *(planned)* |

## How to use this folder

- **Read** `adr/` before proposing a structural change — if a decision already exists, extend/adjudicate rather than relitigate.
- **Projects that change a decision** must write a new ADR (or supersede an existing one) in the same PR.
- **Non-decisions** (how-tos, notes, exploration) stay out of `adr/`; put them in the repo `notes/` or the relevant job folder in workspace.

## ADR workflow (kept small on purpose)

1. Use the template from `docs/adr/README.md`.
2. Fill Status (Proposed / Accepted / Superseded), Date, Context, Decision, Consequences.
3. Reference the PR that implements it.

## Status legend

- **Proposed** — written, awaiting explicit approval (hybrid-control rule: nothing deployed without Vini's sign-off).
- **Accepted** — approved; treat as the working decision.
- **Superseded** — replaced by a newer ADR.

Last updated: 2026-08-27.

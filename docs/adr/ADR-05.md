# ADR-05 — Automatic snapshot publishing and cadence

**Status:** Accepted
**Date:** 2026-10-24

## Context

Within 24 hours of v2.5.1, ADR-04 §4's publishing path failed twice
in practice:

1. The rolling snapshot PR was never created. `gh pr create` failed
   with `GitHub Actions is not permitted to create or approve pull
   requests`: the repository setting *Allow GitHub Actions to create
   and approve pull requests* was off, and the `pull-requests: write`
   grant in the workflow does not override it. The step ended with
   `|| true`, so every run stayed green while `public/data/epochs.json`
   on main kept serving the seeded epochs 4891-4894 and the
   `data/snapshots` branch drifted 3 commits ahead.
2. Even with the PR created, publishing depended on a human merging
   it ("merge when convenient"), so the site's history was stale
   until someone happened to merge.

The repo setting was enabled on 2026-10-24. Two decisions remain:
how often to run, and who merges.

Cadence reality: an epoch is ~7.5h (43,200 blocks). The script
records the current epoch and finalizes the previous epoch's reward
from `validator_reward_paid_prev_epoch`, which is only visible
during the following epoch. So an epoch with no run inside it is
silently absent from the file: no stake, no duties, no reward. With
runs spaced 8h, an epoch fits entirely inside one gap whenever it
starts within ~30min after a run; epoch phase drifts ~0.5h per epoch
against a fixed schedule, so roughly one epoch in 16 is lost. With
6h spacing a miss is impossible for punctual runs, the schedule
tolerates up to ~1.5h of GitHub scheduler delay, and the only
remaining loss mode is a fully skipped run (12h gap), recoverable
with `node scripts/data-snapshot.mjs --backfill=2`.

Cost: the repository is public, so scheduled minutes are free; the
scheduler's real constraint is the cron minute, not the run count.
:41 avoids the busy top of the hour.

## Decision

1. **Cadence: 4 runs per 24h, every 6h at minute 41**
   (`cron: "41 1,7,13,19 * * *"`). 6h is below the epoch length, so
   every epoch is sampled at least once and every reward finalizes
   on the first run of the next epoch.
2. **Publishing is automatic.** The workflow creates the rolling PR
   when absent and merges it immediately with
   `gh pr merge --merge`. Data reaches main on every run, and the
   site reflects it after the resulting Vercel deploy. The manual
   merge gate from ADR-04 §4 is removed.
3. **Failures are loud.** `gh pr create` and `gh pr merge` errors
   fail the run; no `|| true`. A broken pipeline shows up as red
   runs while the UI keeps labeling its coverage window honestly.

## Consequences

- Data-only commits land on main without human review. The snapshot
  script is deterministic, dependency-free, read-only (RPC +
  NearBlocks GETs) and writes one JSON file; a bad publish reverts
  by restoring the previous `epochs.json`.
- PRs created and merged with `GITHUB_TOKEN` do not trigger other
  repository workflows (GitHub policy). None are configured for
  `on: push`; Vercel deploys from webhooks, which fire on the merge.
- Branch protection today requires no reviews and no status checks
  on main. If that changes, auto-merge fails loudly and publishing
  pauses until the workflow is updated; that is the intended
  failure mode.
- A skipped run can still drop one epoch (12h gap). Detect it by
  gaps in the `epoch` sequence in `epochs.json` or by red runs;
  recover with `node scripts/data-snapshot.mjs --backfill=2`.

## Supersedes / References

- Amends [ADR-04](./ADR-04.md) §4: cadence hourly → 4 runs/24h;
  the rolling PR is merged by the workflow instead of a human.
- Implementation: `.github/workflows/data-snapshots.yml`,
  `scripts/data-snapshot.mjs`,
  `src/components/data/HistoryPanel.tsx`.

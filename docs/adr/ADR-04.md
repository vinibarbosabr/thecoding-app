# ADR-04 — Metrics, FAQ, and the data view

**Status:** Accepted
**Date:** 2026-10-23

## Context

Delegators keep asking two questions the v2 hub does not answer: "how
much do I actually earn?" and "is the node healthy?". The v2 shell
deliberately excluded validator stats (ADR-03 §5) to keep the
stake/unstake journey lean, so today a delegator must leave the app for
near-staking.com or nodestats to check uptime, endorsements, or yield.

There is also a positioning reason: thecoding publicly supports HSP-029
(24-month issuance ramp to a 1.6% emission target,
[gov.houseofstake.org/proposals/29](https://gov.houseofstake.org/proposals/29)).
Being the readable source of truth for staking economics (pool APY,
network stake ratio, live protocol issuance parameters) is the
portfolio play; it needs a place to live without bloating the hub.

Data reality, verified against mainnet on 2026-10-23 (epoch 4894):

- The standard RPC `validators` method (with `{"latest":null}`) returns,
  per epoch: the full validator set with stakes, the pool's expected and
  produced blocks / chunks / endorsements, the reward paid to the pool
  in the previous epoch, kickouts, and the pool's next-epoch membership.
  Verified on both endpoints in `RPC_URLS`.
- `EXPERIMENTAL_protocol_config` (with `{"finality":"final"}`) returns
  live protocol parameters: `max_inflation_rate` (1/40 = 2.5%/yr today),
  `epoch_length` (43,200 blocks), kickout thresholds, shard layout.
  Verified on both endpoints.
- NearBlocks' public `api.nearblocks.io/v1/stats` (no key, CORS `*`)
  returns circulating and total supply, nodes online, and price.
- **No public source serves per-epoch history.**
  `EXPERIMENTAL_validators_info` is not implemented on either endpoint,
  and near-staking.com / nodestats.nearcatalog.xyz expose no open API.
  History must be collected ourselves.

Everything the delegator needs is public data; none of it requires a
backend, a key, or a signature.

## Decision

### 1. Two surfaces, hub stays lean

The stake/unstake hub gains exactly two additions and nothing else:

- a fourth cell in `~/pool`: **epoch apy** (last epoch's reward,
  annualized, net of pool fee), labeled `est` because the base stake is
  derived (below) and the epoch length is an estimate
  (`EPOCH_HOURS_ESTIMATE` in src/config.ts);
- a collapsed `~/faq` panel below `~/actions` with three disclosures.

All node metrics, network metrics, history charts, and issuance data
live on a separate **data view at `app.thecoding.dev/#/data`**. Hash
routing (`window.location.hash`), no router dependency, no server
rewrite. A path route (`/data`) would need a `vercel.json` SPA rewrite;
that file is frozen per ADR-02 discipline and is not touched.

The hub links to the data view through a dim foot line in `~/pool`
(`epoch N · full node & network data →`); the data view links back.
Nothing auto-navigates.

This amends ADR-03 §5 in one direction only: "no validator-health stats
in the delegator hub" still holds (validator health renders on the data
view, not in the hub), and "no new routes" is superseded by this ADR for
the single `#/data` hash route.

### 2. Epoch APY definition (documented, estimated)

Gross epoch APY = `reward paid to the pool in the previous epoch`
divided by `previous epoch's total stake`, annualized at
`8760 / 7.5` epochs per year. Net APY multiplies by `(1 - fee)`.
The previous stake base is derived: `current total staked balance -
previous epoch reward`, because the RPC reports the reward of the epoch
that just ended while `get_total_staked_balance` reports the present.
Both values are read live; the copy keeps the `est` marker and points to
the full derivation on the data view. Verified live for epoch 4893:
17.238613 Ⓝ reward on a 432,194.135 Ⓝ base = 4.66% gross,
4.42% net of the 5% pool fee.

### 3. Data sources and trust anchors

- **RPC reads, read-only:** `validators` and
  `EXPERIMENTAL_protocol_config` go through the same origins already
  trusted in `src/config.ts` (`RPC_URLS`), with the same fallback walk
  as pool reads. No new RPC origin.
- **NearBlocks `api.nearblocks.io`:** a new runtime origin, read-only
  GET, no key, for supply / nodes-online stats. Failure is isolated: the
  panels that depend on it render their RPC-only values and mark the
  rest unavailable. Recorded here per ADR-02 rule 4 (new runtime
  dependency on a public read-only API; nothing it returns gates money
  movement).
- **Pool contract reads:** unchanged (`get_reward_fee_fraction`,
  `get_total_staked_balance`), no new contract methods.
- Nothing in the metrics path signs, writes, or touches wallet state.

### 4. History: self-collected epoch snapshots

`scripts/data-snapshot.mjs` (plain Node, zero dependencies) reads the
same sources and appends/updates one record per epoch in
`public/data/epochs.json`, a **build-time static file**. A scheduled
GitHub Action runs it hourly, keeps the current epoch's record fresh,
finalizes the previous epoch on rollover (its exact reward and closing
stake are visible in the first run of the next epoch), and pushes a
single rolling `data/snapshots` branch that maintains one open PR.
Runtime fetch is same-origin (`fetch("data/epochs.json")`): the app
stays static-only, no serverless, no database (ADR-02 unchanged). Chart
copy is honest about coverage: "recording since epoch N".

### 5. Charts and UI constraints

Hand-rolled SVG chart components (line, area fill, bars) consuming the
ADR-03 token system only; no chart library, no new npm dependencies,
`npm audit` baseline stays 0. Numbers in mono `tabular-nums`, lowercase
copy, no em dashes, no new hues, status chips name the data source
(`read: rpc`, `read: nearblocks`), foot lines cite sources. Both themes
first-class; `prefers-reduced-motion` disables chart transitions.

### 6. FAQ

Three static disclosures, ordered by beginner fear: (1) custody, what
the pool can and cannot do with delegated stake; (2) unbonding and the
two-step unstake/withdraw flow; (3) rewards: when they accrue, the
fee's scope, and where the live APY shows. Prose in system sans per
ADR-03 §4. Every claim is fact-checked against NEAR docs and live
contract behavior before merge; the live fee and APY values render from
data, never hard-coded copy.

### 7. Custody and signing path unchanged

No change to the six write builders, the wallet flow, or any ADR-01 /
ADR-02 invariant. The metrics path is read-only and cannot gate or
alter a money movement. `vercel.json` is untouched (CSP already allows
these connects: it has no `connect-src` / `default-src`).

## Consequences

- `api.nearblocks.io` enters the runtime read perimeter. If it
  rate-limits or fails, the app degrades to RPC-only values with dim
  placeholders; reviewers should keep it the only non-RPC data origin.
- The snapshot pipeline is CI-side maintenance: a broken or stopped
  workflow does not break the app, it only stops the history from
  growing (the UI labels its coverage window honestly).
- The APY figure is an estimate by definition (derived base, estimated
  epoch length); copy must keep the `est` marker so the number is never
  read as a protocol promise.
- Payload discipline: the `validators` response is large (~300 KB);
  fetches are module-cached with a short TTL and shared across
  components so the hub and data view do not double-fetch.
- New UI must consume tokens (ADR-03 consequence, unchanged).

## Supersedes / References

- Amends [ADR-03](./ADR-03.md) §5 (hub panel set; one hash route);
  supersedes neither ADR-01 nor ADR-02.
- HSP-029: [Establish a 24-Month Issuance Ramp to a 1.6% Target Rate of
  NEAR Token Emissions](https://gov.houseofstake.org/proposals/29)
- References checked during recon (2026-10-23):
  [near-staking.com/validator/thecoding.pool.near](https://near-staking.com/validator/thecoding.pool.near),
  [nodestats.nearcatalog.xyz/validators/thecoding.pool.near](https://nodestats.nearcatalog.xyz/validators/thecoding.pool.near),
  [nearblocks.io](https://nearblocks.io)
- Implementation: `src/lib/metrics.ts`, `src/lib/networkRead.ts`,
  `src/components/DataView.tsx`, `scripts/data-snapshot.mjs`,
  `.github/workflows/data-snapshots.yml`

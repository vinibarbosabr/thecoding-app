# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Snapshot publishing: the rolling data PR was never created (the
  repo lacked the GitHub Actions setting *Allow GitHub Actions to
  create and approve pull requests*, enabled 2026-10-24) and the
  step hid the failure behind `|| true`, so the `#/data` view kept
  serving the seeded epochs 4891-4894 while snapshots piled up on
  `data/snapshots`. The workflow now auto-merges the rolling PR and
  fails loudly on PR errors ([ADR-05](docs/adr/ADR-05.md)).
- Snapshot workflow: `actions/checkout`'s default depth-1 clone left
  `main` and `data/snapshots` without a shared merge base in the
  runner, so the in-run `git merge origin/main` failed with
  `refusing to merge unrelated histories` once the branches diverged
  (the steady state after the first rolling PR merges). The checkout
  now fetches full history.

### Changed

- Snapshot cadence: hourly → 4 runs per 24h, every 6h at :41 UTC.
  6h is below the ~7.5h epoch length, so every epoch is still
  sampled; an epoch lost to a skipped run is recoverable with
  `node scripts/data-snapshot.mjs --backfill=2`.

## [2.5.1] - 2026-10-23

The research surface: node, network, issuance, and per-epoch history
land on a read-only `#/data` view, and the epoch charts plot the
reward-inclusive stake change delegators actually feel. Custody model
and security posture are unchanged ([ADR-01](docs/adr/ADR-01.md),
[ADR-02](docs/adr/ADR-02.md)); the data decisions are recorded in
[ADR-04](docs/adr/ADR-04.md). Shipped in
[#19](https://github.com/vinibarbosabr/thecoding-app/pull/19) and
[#20](https://github.com/vinibarbosabr/thecoding-app/pull/20).

### Added

- `#/data` view ([ADR-04](docs/adr/ADR-04.md)): live node stats
  (epoch duties, stake rollover with reward and delegation split,
  kickout and slash record), network staking totals (staked sum,
  staked ratio, validators, supply), protocol issuance parameters
  with the HSP-029 framing, and per-epoch history charts. All
  read-only from public RPC, the pool contract, and NearBlocks
  stats; no backend, no new npm dependencies.
- Epoch snapshot pipeline: `scripts/data-snapshot.mjs` records one
  epoch at a time into `public/data/epochs.json` (build-time static
  data), an hourly GitHub Action maintains one rolling data PR, and
  the app fetches the file same-origin. Seeded live with epochs
  4891-4894.
- APY cell in `~/pool`: previous epoch's reward annualized net
  of the pool fee, read live from the RPC `validators` method.
  Labeled `est · net of fee`; the derivation is documented in ADR-04 §2.
- `~/faq` panel below `~/actions`: custody, unbonding/withdraw, and
  rewards disclosures, copy fact-checked against NEAR docs and the
  core-contracts staking pool source.

### Changed

- The hub and `#/data` cross-link prominently: a `LeadLink` block
  beside the custody note at the top of each surface (the note moves
  down from the site header into the intro block), plus the
  `node & network data →` link in the `~/pool` foot.
- `~/pool` cell `epoch apy` renamed to `apy` (APY is an annualized
  figure, not a per-epoch one). The four cells sit side by side,
  value over label: `fee 5.0% / of rewards`, `432.23k Ⓝ / total
  staked`, `~4.43% / est. apy`, `4 epochs (~30h) / unbonding time`;
  `total staked` renders compact.
- `~/actions` lookup intro breaks into two lines: the question, then
  the read-only explainer.
- `~/node` reward cell shows the same net APY estimate under the
  reward figure; the foot line is relabeled `node key · public` so the
  `ed25519:…` value reads as what it is: the public on-chain consensus
  key, not secret material.
- `~/epochs` charts the per-epoch stake change instead of the
  delegation-only net flow: the old metric stripped the ~17 Ⓝ
  auto-compounded reward out and plotted ~0.0001 Ⓝ of noise.
  Bars now plot the reward-inclusive change (1,000 Ⓝ staked on a
  17 Ⓝ reward reads +1017 Ⓝ; a 34 Ⓝ unstake reads -17 Ⓝ), split
  into two segments: the reward block hugs the zero line,
  delegations stack outward from it, so each bar's outer edge is
  the epoch's total change. The table's flow column becomes
  change (reward + delegations) and the caption sums the window:
  `Σ +51.9929 Ⓝ · largest +17.4419 Ⓝ` on the seeded history.
- All three `~/epochs` charts label their plotted values: the apy
  and stake-change bars carry a value row under the plot (thinned
  to 12 slots as history grows) and the stake line labels its
  first and last values; captions keep the epochs and counts.
- `~/node` next-epoch hint splits the rollover delta the same
  way: `+17.61 Ⓝ at rollover · reward +17.2386 · delegations
  +0.3734 Ⓝ`.

### Security

- October 2026 threat audit ([docs/security](docs/security/2026-10-22-threat-audit.md)):
  no direct exposure in the PHP2Shell / LiteLLM / eMudhra / Next.js /
  TiDB / Plex / appliance wave. Node pinned for the October 2026
  security releases to `24.x` (`engines`, `.nvmrc` 24.22.1 — Vercel's
  build image has no 26.x major and auto-rolls security patches; see
  the audit note's correction), dev tree cleared to `npm audit` = 0
  via vite 6.4.5, vitest 5.0.5, and a tailwindcss 3 → 4.3.3 migration
  (CSS-first theme tokens in `src/index.css`; scoped CSP, custody
  model, and contract builders unchanged).
- Shipped-dependency audit gate restored: lockfile-only bump of
  `pbkdf2` to 3.1.7 (production tree) and `source-map-js` to 1.2.2
  (dev tree). `npm audit --omit=dev` reports 0 vulnerabilities.
  Shipped in
  [#15](https://github.com/vinibarbosabr/thecoding-app/pull/15).

## [2.0.0] - 2026-10-09

Second generation of the interface: a modern terminal identity for the
v2 shell, shipped on [app.thecoding.dev](https://app.thecoding.dev).
The custody model and security posture are unchanged
([ADR-01](docs/adr/ADR-01.md), [ADR-02](docs/adr/ADR-02.md)); the
redesign decisions are recorded in [ADR-03](docs/adr/ADR-03.md).
Shipped in
[#12](https://github.com/vinibarbosabr/thecoding-app/pull/12).

### Added

- Brand token system: three locked colors (`field`, `paper`, `signal`)
  with per-mode semantic tokens; dark is the default hero mode, light
  keeps the paper identity; theme choice persists (stored, else
  system preference, else dark).
- Self-hosted JetBrains Mono (two weights, SIL OFL license shipped
  alongside); system sans carries help prose; numbers set in
  `tabular-nums`.
- Read-only account lookup before connecting, including eth-implicit
  `0x…` accounts, plus live pool stats, straight from public RPC view
  calls. No wallet prompt, no signing.
- Pre-sign lines above every write: receiver, method, gas, and deposit
  visible on the page before the wallet popup opens.
- Window-chrome panels (`~/position`, `~/pool`, `~/actions`) with
  plain-language help one click away; a typographic wordmark replaces
  the logo images (zero image assets in the shell).
- ADR-03: the visual system recorded as working architecture.

### Changed

- Actions are availability-driven instead of state-exclusive: all six
  contract writes stay reachable in mixed-balance positions (for
  example staked and withdrawable at once).
- Display dust (balances under 0.0001 NEAR) no longer flips the
  journey state or enables dead withdraw forms.

### Fixed

- Button variant styles: a style-map key mismatch rendered primary and
  quiet controls as bare text.
- Position data now resets on wallet switch so one account's balances
  never render for another.

## [1.0.0] - 2026-10-07

First baseline release of the self-custodial staking UI for
`thecoding.pool.near`. The tag is retroactive: it marks the v1 feature
set as shipped on [app.thecoding.dev](https://app.thecoding.dev).

### Added

- Self-custodial staking: connect a NEAR wallet and sign stake, restake,
  unstake, unstake-all, withdraw, and withdraw-all directly from the
  browser. No backend, no key storage ([ADR-01](docs/adr/ADR-01.md)).
- Live position view from public RPC: staked, unstaking, liquid wallet
  balance, pool fee, and total pool stake.
- Contract-gated withdrawals: the withdraw control follows
  `is_account_unstaked_balance_available`, not a browser clock.
- Client-side validation before the wallet popup: non-zero amounts, `.`
  and `,` decimal marks, and a 0.05 NEAR liquid buffer for gas.
- Transaction toasts with NearBlocks links; light and dark mode; MIT
  license; static hosting.

### Security

- Security posture recorded and enforced ([ADR-02](docs/adr/ADR-02.md)):
  no key material in the app trust boundary, static-only hosting, scoped
  CSP tuned for the wallet sandbox, dependency hygiene on the signing
  path (unused `near-api-js` removed; advisory-affected dev tooling
  upgraded).

[2.5.1]: https://github.com/vinibarbosabr/thecoding-app/releases/tag/v2.5.1
[2.0.0]: https://github.com/vinibarbosabr/thecoding-app/releases/tag/v2.0.0
[1.0.0]: https://github.com/vinibarbosabr/thecoding-app/releases/tag/v1.0.0

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

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

[2.0.0]: https://github.com/vinibarbosabr/thecoding-app/releases/tag/v2.0.0
[1.0.0]: https://github.com/vinibarbosabr/thecoding-app/releases/tag/v1.0.0

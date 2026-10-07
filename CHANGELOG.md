# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- v2 work accumulates here until the v2.0.0 release cut. -->

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

[1.0.0]: https://github.com/vinibarbosabr/thecoding-app/releases/tag/v1.0.0

# ADR-03 — Visual system: modern terminal identity for the v2 shell

**Status:** Proposed
**Date:** 2026-10-09

## Context

Issues #7 (shell), #8 (position panel), and #9 (journey) call for a
redesign with the direction: "hackers style, modern (slightly
futuristic) terminal windows, clean and lightweight, readable by
non-developers."

v1 shipped with no brand identity: neutral grays, four competing accent
hues (emerald, amber, sky, red), logo images, and stacked action cards
that listed every possible write at once. The redesign was developed as
a full-page static mockup with fake data and locked decisions were
reviewed against it before any production code was written. Three
amendments were approved during review: the inline yes/no confirm lines
were removed (one-click quiet actions, rationale in §6), the footer link
set was finalized, and an em-dash ban was applied to all UI copy.

This ADR records the visual decisions. It changes no custody or
security property: ADR-01 (self-custody) and ADR-02 (security posture)
continue to apply unchanged.

## Decision

### 1. Identity: modern terminal, not retro CRT

Flat surfaces, crisp 1px borders, small radii (10/8/6px: panel /
control / chip), and window-chrome panels: three dots, a `~/path` title,
and a status chip. Mono type carries all data; UI copy is lowercase.
Every terminal idiom keeps a plain-language disclosure one click away.

Explicitly rejected: scanlines, glow, glassmorphism, gradients, leet
speak, Matrix rain, dense dashboards.

### 2. Palette: three brand colors, derived shades only

Three locked brand colors, plus derived shades and alpha steps of those
same hues. No other hue enters the palette except one functional error
red per mode.

| Token | Value | Role |
| --- | --- | --- |
| `field` | `#042f2e` | dark ground / light ink |
| `paper` | `#fff3ce` | light ground / dark ink |
| `signal` | `#5ce7ff` | the single loud accent: primary fills, focus ring (dark), live states |

Semantic tokens (`ground`, `surface`, `ink` with alpha steps, focus,
error) resolve per mode from CSS custom properties mapped into Tailwind;
components consume tokens only, never raw hex. Text on `signal` fill is
`field` in both modes (9.9:1).

- Dark (default): field ground, raised panel `#0a403e`, paper ink,
  signal is text-safe (9.9:1 on ground).
- Light: paper ground, warm near-white panel `#fffdf4`, field ink.
  Raw signal as text on paper is ~1.3:1 (unusable), so a darker shade of
  the same hue, `signal-ink` `#00647a`, carries all text accents, links,
  and the focus ring (6.1:1 on paper). Signal remains fill-only there.
- Error: exactly one functional red per mode (`#ff7d7d` dark, `#b3261e`
  light). Users need unambiguous failure; a red-free error would read
  too quietly. This is the single deliberate non-brand color.
- Locked / pending states are neutral: dim text plus dashed-border
  chips. Locked is a waiting state, not an alarm (this removes v1's
  amber). Success reuses `signal`; there is no green token.

### 3. Themes

Dark is the default and the hero mode; light is kept as the brand's
paper identity. Resolution order: stored choice, else
`prefers-color-scheme`, else dark. Both modes are first-class: same
tokens, same components. Focus is always in the signal family: `signal`
outline in dark, `signal-ink` in light, ≥ 3:1 non-text contrast in both.

### 4. Typography

- JetBrains Mono, self-hosted in `public/fonts/` (woff2, weights 400
  and 600), for numbers, labels, account ids, buttons, panel titles,
  and the wordmark. System sans (zero bytes) for help prose so
  non-developers stay comfortable.
- No CDN and no new origins: the current CSP has no `font-src` /
  `default-src`, so same-origin fonts need no `vercel.json` change.
  Zero CSP delta.
- JetBrains Mono is SIL OFL; the license file ships alongside the
  fonts with attribution in `index.css`.
- Numbers: `tabular-nums`, thousands separators, up to 4 decimals,
  `Ⓝ` unit in dim. All UI copy lowercase (accepted tradeoff: slightly
  slower scanning of error sentences; they stay short and lead with
  `error:`).

### 5. Shell layout

Single column, max-width 672px, mobile-first, usable at 360px, no new
routes. Panels in order:

- `~/position`: staked (accent), unstaking/withdrawable (one row whose
  label and chip flip on the contract's availability flag), liquid
  (wallet). Dim footer row: pool id + account id.
- `~/pool`: fee, total staked, unbonding constant (4 epochs, ~30h).
  Validator-health stats are rejected for v2: they need indexer reads
  and belong to a validator page, not a delegator hub.
- `~/actions`: state-driven (§6).
- Footer: ecosystem links (thecoding.dev, newsletter,
  x.com/vinibarbosabr, the GitHub repo, NEAR staking docs) and the
  custody line, which links the pool id to its NearBlocks address.
- Backdrop: binary glyph columns, static, ~5% opacity, dark mode only,
  `aria-hidden`. Zero image assets anywhere in the shell; the logo pngs
  retire in favor of a typographic wordmark
  (`[thecoding].pool.near` + blinking signal cursor,
  reduced-motion-safe).

### 6. Journey map

Exactly one primary action per state; all six ADR-01 writes remain
reachable within two interactions; receiver and method are visible
before approval.

| State | Primary | Quiet row |
| --- | --- | --- |
| s0 disconnected | connect wallet (header); read-only lookup form | — |
| s1 empty | stake | how staking works |
| s2 staked | unstake | stake more (swaps the primary), unstake all |
| s3 unbonding | stake more | locked chip + estimate; unstake + unstake all when staked is visible; help disclosure |
| s4 withdrawable | withdraw | restake, unstake, stake more (swaps, when their balances allow); withdraw all + unstake all |

- A pre-sign line, `→ thecoding.pool.near::method() · 50 tgas · 0
  deposit|deposit attached`, sits above every primary write so the
  receiver, method, gas, and deposit are visible before the wallet
  popup opens.
- **One-click quiet all-actions:** `unstake all` and `withdraw all` are
  single-click text actions with no inline yes/no confirm. The wallet
  popup is the real gate: it re-shows receiver, method, and deposit
  before any signature, and the pre-sign line already showed them in
  the page. The removed inline confirm was a weaker, fake gate, and
  `max` + primary reaches the same result anyway.
- Client checks are preserved from v1: non-zero amounts, `.` and `,`
  decimal marks, max clamps, the 0.05 NEAR liquid buffer for gas, and
  withdraw enabled only when the contract reports availability. The
  locked chip shows an estimate explicitly labeled `est`; the contract
  is the gate.
- Read-only account lookup ships in s0 (serves eth-implicit `0x…`
  delegators before connecting): public RPC view calls only, no wallet
  prompt, no signing.

Amendment (2026-10-09, after manual wallet testing on mainnet):

the state table above proved too rigid live: an account with both
staked and withdrawable balances was locked into the withdraw row and
could not unstake. actions are therefore availability-driven, not
state-exclusive: the state chip and help copy stay state-driven, but
every write whose balance is available renders somewhere (primary,
swap, or one-click text action). availability rules: stake when
liquid exceeds the 0.05 buffer; unstake and unstake all when staked
is visible; restake, withdraw, and withdraw all when unstaked is
visible and the contract reports availability. visible means
formatNear renders it nonzero (>= 0.0001 near): display dust neither
flips the state nor enables its write, so a dust-withdrawable
account gets the staked journey, not a dead withdraw form.

### 7. Security posture unchanged

- No new external origins: fonts self-hosted same-origin; backdrop is
  DOM text; ecosystem links are anchors, not resource loads.
  `vercel.json` is untouched.
- No new dependencies; iconography is typographic glyphs from the
  loaded fonts.
- The signing path is untouched: `src/lib/pool.ts` and its contract
  call-table test are unchanged, and no key material appears anywhere.

## Consequences

- The token system is the single source of visual truth: new UI must
  consume tokens; introducing a raw hex value or a new hue in a
  component is a review-rejectable drift.
- The official JetBrains Mono release publishes full-charset webfonts
  (~92KB per weight) rather than latin subsets; two weights ship as-is
  (~184KB total) with `font-display: swap`.
- `npm audit` baseline is unchanged by this work (no dependency
  changes); pre-existing advisories in dev/build tooling are tracked
  and gated separately per ADR-02 rule 4.
- Wallet modal ordering remains an open implementation item on #7.

## Supersedes / References

- Builds on [ADR-01](./ADR-01.md) (custody model) and
  [ADR-02](./ADR-02.md) (security posture); supersedes neither.
- Issues: #7 (shell), #8 (position panel), #9 (journey), #10
  (eth-implicit delegators).
- Fonts: [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)
  (SIL OFL 1.1).
- Validator address: [thecoding.pool.near on
  NearBlocks](https://nearblocks.io/address/thecoding.pool.near)

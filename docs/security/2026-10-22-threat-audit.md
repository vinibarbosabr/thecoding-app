# Threat audit — October 2026 supply-chain / RCE wave

**Date:** 2026-10-22 · **Scope:** this repository and its shipped bundle
(the `thecoding.pool.near` staking UI). Prompt: Mudit Gupta's October 2026
incident roundup
([source](https://x.com/Mudit__Gupta/status/2112938784392163779)):
PHP2Shell, the LiteLLM v1.107.0 backdoor, the eMudhra intermediate-CA
compromise, the Node.js / Next.js / React October security releases, the
TiDB Cloud (PingCAP) breach, Plex2Shell, and the BeyondTrust / Ivanti
zero-days.

## Method

- Manifest + lockfile sweep (`package.json`, `package-lock.json`) for
  every named package and version. The repo has no Python, PHP, Go, or
  Docker surface: no `requirements*.txt`, `pyproject.toml`, `composer.*`,
  `go.sum`, or `Dockerfile` exist in the tree.
- `npm audit` on the full tree and on `--omit=dev`.
- Read-only runtime checks on the development host: `node -v`, PHP
  (absent), pip / pipx LiteLLM (absent), Docker images (none matching),
  Plex Media Server (absent).
- Grep of the signing path against the ADR-02 forbidden APIs
  (`addFunctionCallKey`, `createLocalKeyFor`): zero calls in `src/`.

## Findings

| Threat | Verdict | Evidence / action |
|---|---|---|
| PHP2Shell (CVE-2026-109618 / CVE-2026-109619) | Not affected | No PHP in the repo (no `.php` files, no `composer.*`); no PHP runtime on the host |
| LiteLLM v1.107.0 backdoor | Not affected | No Python manifests in the repo; no `litellm` via pip or pipx on the host; no matching Docker images |
| eMudhra intermediate CAs | Covered by platform updates | The app bundles no trust store, pins no certificates, and ships no custom CA files; browser trust is handled by browser vendors. The Node runtime fix ships in the October 2026 releases — applied below |
| Node.js October 2026 releases (CVE-2026-111497 Brotli RCE, TLS hostname bypasses, `dns.resolve` truncation, …) | **Fixed** | Runtime floor was `>=22.12.0`, which admitted unpatched lines. Builds now pin Node `24.x` via `engines` with `.nvmrc` at 24.22.1 locally (fix 1; see the correction note for why not 26). The app is a static SPA, so Node is build/dev tooling, not a serving runtime; ADR-02 still treats dev-tool advisories as real |
| Next.js RCEs (GHSA-673q-mjm6-r5xr, GHSA-2464-fhr4-w9xw) | Not affected | No `next` or `sharp` anywhere in the tree or lockfile; no image optimization. React is `^18.3.1` (`package.json:19`) and cache components are not used |
| TiDB Cloud / PingCAP breach | Not affected | No TiDB usage, API keys, or credentials anywhere in the repo |
| Plex2Shell (CVE-2026-96652 … -96656) | Not affected | No Plex Media Server on the host (binary absent, service inactive) |
| BeyondTrust (CVE-2026-102764) / Ivanti (CVE-2026-104935) zero-days | Not affected | No Remote Support / Connect Secure appliances in scope |
| `npm audit` (adjacent, pre-existing) | **Fixed** | 10 advisories in the dev tree (vite 6.4.3 dev-server, vitest 5.0.0 / `@vitest/mocker` 5.0.0, `braces` + `postcss-selector-parser` via tailwindcss 3). Cleared by fixes 2–3; audit now reports 0 |

The production dependency tree (`npm audit --omit=dev`) was already at
0 vulnerabilities ([#15](https://github.com/vinibarbosabr/thecoding-app/pull/15));
every fix below targets the dev/build tree, which ADR-02 treats as real
attack surface: "the machine that runs `npm dev`/`npm test` often holds
the operator's own wallets" ([ADR-02](../adr/ADR-02.md)).

## Fixes shipped (branch `fix/security-audit-2026-10-22`)

1. **Node pin for the October 2026 releases.** `engines.node` is
   `"24.x"` (`package.json:6-8`), `.nvmrc` pins `24.22.1` for local
   dev, `@types/node` matches the 24.x floor, lockfile root engines
   synced, README / CONTRIBUTING prerequisites updated.
   *Correction (2026-10-22):* this fix first shipped as a
   `>=26.12.1` floor with `.nvmrc` 26.12.1, which hard-failed on
   Vercel. The Vercel build image offers only the `24.x` and `22.x`
   majors ([supported
   versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions));
   an `engines` range no available major satisfies is rejected with
   "invalid or discontinued Node.js version" (the previous
   `>=22.12.0` floor silently resolved to latest 24.x, which is why
   earlier builds ran 24.x). Pinning `"24.x"` builds on the latest
   patched 24 line — Vercel states it "automatically rolls out minor
   and patch updates when needed, such as to fix a security issue" —
   and the build log confirms the resolved version. Node 26.12.1
   remains a valid patched choice for local dev, but is not
   selectable on Vercel.
2. **In-range audit fixes.** vite 6.4.3 → 6.4.5 (dev-server advisories,
   incl. GHSA-9jrq-w75r-8gcw), vitest 5.0.0 → 5.0.5 and
   `@vitest/mocker` 5.0.0 → 5.0.5 (GHSA-qxg6-89mg-rqv8,
   GHSA-xp26-3454-mjgp); manifest ranges tightened to match.
3. **tailwindcss 3.4.19 → 4.3.3.** Clears the last two advisories
   (`braces` GHSA-vfj7-8cjw-p6xm, `postcss-selector-parser`
   GHSA-rj75-hqrm-r3gf, both transitive via tailwindcss 3). CSS-first
   config: `tailwind.config.js` deleted, theme tokens moved to
   `@theme` / `@theme inline` in `src/index.css`, PostCSS plugin
   swapped to `@tailwindcss/postcss` (autoprefixer dropped; Tailwind 4
   handles prefixing), `focus:outline-none` renamed to
   `focus:outline-hidden` per the v4 upgrade guide
   (`src/components/ui/inputStyles.ts:2`), and the app's
   `:focus-visible` rule moved into `@layer base` so utilities keep
   their v3 override semantics. Utility names are unchanged
   (`rounded-panel`, `bg-surface`, `text-ink-*`, `shadow-pop`, …), so
   no component classes changed.

## Verification

- `npm test`: 51 passed (6 files) — the pool contract table is
  unchanged.
- `npm run build`: clean; compiled CSS spot-checked in `dist/assets/`
  for the migrated tokens: `.bg-surface` → `var(--surface)`,
  `.rounded-panel` → `var(--radius-panel)`, `.shadow-pop`, `.font-mono`
  → `var(--font-mono)`, `.dark{--ground:…}` mode vars, the
  `:focus-visible` base rule, and `.focus\:outline-hidden:focus`.
- `npm audit`: **0 vulnerabilities** (full tree);
  `npm audit --omit=dev`: 0.
- Signing path untouched: `src/lib/pool.ts`, `src/config.ts`, and
  `vercel.json` (CSP) show no diff in this branch; zero
  `addFunctionCallKey` / `createLocalKeyFor` calls in `src/`.
- No new ADR required: the custody model (ADR-01) and security posture
  (ADR-02) are unchanged; the `npm audit` gate is already codified in
  ADR-02 rule 4.

## Follow-ups

- After merge: confirm the Vercel build log resolves to a patched
  24.x (≥ 24.22.1) and smoke-test wallet connect on the preview URL.
- `npm install` on a Node 26 host prints a cosmetic `EBADENGINE`
  warning because `engines` is `"24.x"`; use `.nvmrc`
  (`nvm use` → 24.22.1) to match the build runtime exactly.
- Keep the ADR-02 dependency gate (`npm audit` clean on shipped
  versions) for future bumps on the signing path.

## References

- Mudit Gupta's incident roundup (2026-10-21):
  `https://x.com/Mudit__Gupta/status/2112938784392163779`
- Node.js October 2026 security releases (22.23.4 / 24.22.1 / 26.12.1):
  `https://nodejs.org/en/blog/vulnerability/october-2026-security-releases`
- Vercel supported Node.js versions (majors 24.x / 22.x; engines
  ranges are resolved against available majors):
  `https://vercel.com/docs/functions/runtimes/node-js/node-js-versions`
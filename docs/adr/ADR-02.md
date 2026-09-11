# ADR-02 — Security posture: key material never enters the app's trust boundary

**Status:** Accepted
**Date:** 2026-09-11

## Context

The app is deployed on Vercel and moves real user funds on mainnet. A
pre-deployment security audit (2026-09-11) reviewed source, git
history, the production bundle, and the wallet stack for ways private
keys or credentials could leak — to the host, the repo, or the browser.

Findings confirmed the ADR-01 custody model: the app never touches key
material, Vercel serves static files only, and no secrets exist in the
repository or history. The audit also surfaced paths that could break
that model later if someone reaches for convenience:

- `near-connect-hooks` ships a function-call-key plugin
  (`createLocalKeyFor` / `signIn({ addFunctionCallKey })`) that
  generates an ed25519 keypair and writes its private key to
  `localStorage` (`access_key::plugin`). The app does not use it; the
  plugin also refuses to sign any action with a deposit attached. The
  path exists, so the prohibition must be explicit.
- The one realistic attack against this app is XSS: a injected script
  could swap the receiver or method before the wallet popup opens.
  Client-side checks do not survive script execution; a CSP does.
- `near-api-js` was a declared but unused dependency pinning a
  vulnerable transitive tree onto the signing path.
- Dev-time tooling carried critical advisories (arbitrary file
  read/execute in the vitest server). Not shipped, but this repo is
  developed on the same machine that holds real wallets.

## Decision

One rule: **key material never enters the app's trust boundary.** The
app's boundary is the browser bundle plus whatever the static host
serves. Four rules implement it.

### 1. Keys and storage

- The app never creates, imports, stores, or transmits private keys,
  seed phrases, or mnemonics. Every balance-changing call is signed in
  the user's wallet (ADR-01).
- **Forbidden:** `signIn({ addFunctionCallKey })`,
  `createLocalKeyFor`, and any other API that writes a private key to
  `localStorage` — even the allowance-limited function-call keys the
  connector supports. Enabling one requires a new ADR that justifies
  browser-held keys and explains the blast radius.
- `localStorage` is restricted to what exists today: the theme key and
  the connector's own wallet session. No credentials, tokens, or keys
  in web storage, ever.

### 2. Hosting and environment

- The app stays a static SPA. No Vercel (or any) serverless functions
  in any path — read or write. A server in the write path changes
  custody (ADR-01); a server in the read path becomes a credential and
  availability liability with no offsetting benefit.
- No secrets in Vercel environment variables. There are none to store
  today; keep it that way. Anything passed to Vite via `VITE_*` ships
  to every visitor — only public values (RPC URLs) are allowed there.
- RPC endpoints are public, hardcoded in `src/config.ts`, and
  allow-listed in the CSP.

### 3. Content-Security-Policy as the custody backstop

The UI's promise — receiver is always `thecoding.pool.near`, methods
only from the six writes in ADR-01 — is enforced client-side before
the wallet popup. CSP is the defense that makes an injected script's
job hard:

- `script-src 'self'`, no `unsafe-inline`, no `unsafe-eval`;
  `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`.
- `connect-src` limited to the RPC endpoints and manifest hosts;
  `frame-src` limited to the wallet executor origins from the
  hot-dao/near-selector manifest. Exfiltration and beacon targets are
  not reachable.
- **Embedding must not be locked down:** `frame-ancestors *` /
  `X-Frame-Options: ALLOWALL`. In-app browsers and wallet wallets
  (HOT inside Telegram, mobile wallets) embed the site; a restrictive
  `frame-ancestors` breaks wallet sign-in — the exact flow this app
  exists for. Do not "harden" this away.
- `style-src 'unsafe-inline'` is accepted (Tailwind runtime class
  toggling); scripts are where the custody risk lives.
- Any CSP relaxation (new `connect-src`, inline script) needs a
  matching justification in the PR that adds it.

### 4. Dependencies on the signing path

- No unused wallet or crypto libraries. Anything that can sign,
  derive, or store keys is removed unless imported
  (the `near-api-js` removal is the precedent).
- Upgrades to the wallet connector, key-handling code, or build/test
  tooling are gated on `npm audit` reporting zero known
  vulnerabilities for the versions being shipped.
- Known trust anchor, accepted: the connector loads wallet manifests
  and executors at runtime from `raw.githubusercontent.com` /
  `cdn.jsdelivr.net` and renders wallets inside sandboxed iframes.
  This is inherent to NEAR Connect; it is allow-listed in the CSP and
  re-reviewed when the connector is upgraded.

## Consequences

- A reviewer can verify compliance mechanically: grep the source for
  `addFunctionCallKey` / `createLocalKeyFor` (expect zero calls),
  confirm no `api/` directory or functions exist, confirm `npm audit`
  is clean, and diff the CSP against `src/config.ts`.
- The function-call-key UX (gasless auto-signing) is off the table for
  v2+ unless a new ADR accepts browser-held keys with a scoped
  allowance.
- Adding any backend feature — points indexer, quote proxy, analytics
  endpoint — needs a new ADR even when it reads only public data,
  because it ends the "static-only, nothing to breach" property.
- CSP changes are part of the security surface: widening a directive
  is reviewed like a dependency change, not a config tweak.
- Dev-tool advisories are treated as real: the machine that runs
  `npm dev`/`npm test` often holds the operator's own wallets.

## Supersedes / References

- Builds on [ADR-01](./ADR-01.md) (self-custodial v1 UI); does not
  supersede it.
- vercel.json (CSP + HSTS + X-Content-Type-Options +
  Referrer-Policy + Permissions-Policy)
- Advisories closed by the 2026-09-11 hardening pass:
  [GHSA-xq7p-g2vc-g82p](https://github.com/advisories/GHSA-xq7p-g2vc-g82p)
  (base-x/bs58, via unused `near-api-js@3`),
  [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)
  (vitest server file read/execute),
  [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)
  (vitest mocker path traversal)
- Wallet manifest trust anchor:
  [hot-dao/near-selector manifest](https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/manifest.json)

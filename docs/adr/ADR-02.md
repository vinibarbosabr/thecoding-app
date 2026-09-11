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

### 3. Scoped CSP — the honest backstop

The UI's promise — receiver is always `thecoding.pool.near`, methods
only from the six writes in ADR-01 — is enforced client-side before
the wallet popup, and confirmed again inside the wallet before any
signature. A script-src-based CSP was attempted (2026-09-11) and broke
wallet connection outright; it is structurally incompatible with the
wallet stack on a static host:

- NEAR Connect fetches wallet executor code at runtime from hosts in
  its manifest (`raw.githubusercontent.com`, `wallet.intear.tech`,
  `near-mobile-production.aws.peersyst.tech`, …) and boots it via
  inline `<script>` blocks inside `srcdoc` sandbox iframes.
  `srcdoc` iframes inherit the parent page's policy, so any
  `script-src 'self'` (and `default-src`) blocks the wallets' own
  boot scripts — every sandboxed wallet silently hangs.
- The library's `cspNonce` escape hatch requires a per-request,
  server-generated nonce. That means edge middleware — a function,
  which rule 2 forbids. A static nonce is not a control: injected
  script reads it from the connector config.

The enforced policy is therefore scoped to vectors that do not
conflict with the wallet sandbox:

- `object-src 'none'`; `base-uri 'self'`; `form-action 'none'` —
  no plugin/object vectors, no base-tag hijacks, no form-action
  exfiltration.
- `img-src 'self' data: https:` — remote icons come from manifest
  hosts that change with the manifest; an open img-src is acceptable
  (images are passive; no script, no credentialed reads).
- `worker-src 'self' blob:`; `frame-ancestors *`.
- Deliberately absent: `script-src`/`default-src` (breaks wallets),
  `connect-src`/`frame-src` (executor hosts evolve with the manifest;
  enumerating them breaks wallets on every manifest update — the
  connector is designed to add wallets without app changes).

Custody therefore does not rest on script gating. It rests on:

1. **Wallet-side confirmation** — the wallet popup shows receiver,
   method, and deposit; the user rejects anything foreign (ADR-01).
2. **Bundle and dependency integrity** — no unused key-capable deps,
   `npm audit`-gated upgrades (rule 4), builds reproducible from
   reviewed source.
3. **The scoped CSP above** — closes the cheap vectors without
   touching the wallet sandbox.
4. **No secrets in the boundary** — the bundle holds no keys or
   credentials (rules 1–2), so an injected script has nothing to
   steal; its realistic move (swapping a receiver) is caught by (1).
- **Embedding must not be locked down:** `frame-ancestors *` /
  `X-Frame-Options: ALLOWALL`. In-app browsers and wallet wallets
  (HOT inside Telegram, mobile wallets) embed the site; a restrictive
  `frame-ancestors` breaks wallet sign-in — the exact flow this app
  exists for. Do not "harden" this away.
- Any future attempt to reintroduce script gating (nonce via
  middleware, allow-listing connector internals) needs a new ADR and
  a wallet-connect regression test against the live selector first.

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
- vercel.json (scoped CSP — wallet-sandbox compatible; HSTS +
  X-Content-Type-Options + Referrer-Policy + Permissions-Policy)
- Advisories closed by the 2026-09-11 hardening pass:
  [GHSA-xq7p-g2vc-g82p](https://github.com/advisories/GHSA-xq7p-g2vc-g82p)
  (base-x/bs58, via unused `near-api-js@3`),
  [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)
  (vitest server file read/execute),
  [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)
  (vitest mocker path traversal)
- Wallet manifest trust anchor:
  [hot-dao/near-selector manifest](https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/manifest.json)

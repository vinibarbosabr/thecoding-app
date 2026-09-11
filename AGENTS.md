# AGENTS.md — thecoding.pool.near staking UI

Self-custodial NEAR mainnet staking UI (`thecoding.pool.near`). Static SPA:
Vite + React + TS + Tailwind, wallet-signed transactions, no backend. Moves real
funds — treat security rules below as hard constraints.

## Commands

```bash
npm run dev          # vite dev server, localhost:5173
npm test             # vitest run (node env, globals on, no services needed)
npx vitest run src/lib/pool.test.ts   # single test file
npm run build        # tsc && vite build
```

- **`npm run build` is the only typecheck** — there is no separate
  `lint`/`typecheck` script. Verify TS correctness via `build`.
- Tests are colocated with source (`src/**/*.test.ts`) and enforce the contract
  call table (receiver, method, deposit, gas) — update `pool.test.ts` together
  with `src/lib/pool.ts`.

## ADRs are binding

`docs/adr/` is the working architecture. A change that contradicts an Accepted
ADR (ADR-01 custody model, ADR-02 security posture) requires a new ADR in the
same change set. Read both before touching the staking path.

## Security invariants (ADR-02) — do not violate

- **No key material in the app.** Never create, import, or store keys/seed
  phrases. Forbidden APIs: `signIn({ addFunctionCallKey })`, `createLocalKeyFor`
  — nothing that writes a private key to `localStorage`. Reviewers grep for
  these; expect zero calls.
- **No backend, ever, in any path.** No Vercel/serverless functions, no `api/`
  directory — even read-only endpoints need a new ADR (they end the
  "static-only, nothing to breach" property).
- **No `VITE_*` secrets.** Everything Vite bakes ships to the browser. RPC URLs
  are public and hardcoded in `src/config.ts`.
- **Do not "harden" `vercel.json`.** The CSP deliberately omits
  `script-src`/`default-src` (breaks NEAR Connect's sandboxed wallet iframes)
  and keeps `frame-ancestors *` / `X-Frame-Options: ALLOWALL` (in-app and mobile
  wallets embed the site). Any CSP widening or script-gating attempt needs a new
  ADR plus a live wallet-connect regression test.
- Dependency upgrades on the signing path are gated on a clean `npm audit`.
  No unused wallet/crypto deps (removed `near-api-js` is the precedent).

## Wallet / network gotchas

- **Always pass `network: "mainnet"` explicitly to `NearProvider`** (src/App.tsx).
  The library default is testnet; that default must not ship.
- Writes go only to `thecoding.pool.near`, always 50 TGas, deposit attached
  **only** on `deposit_and_stake`; never submit `0` amounts. Builders live in
  `src/lib/pool.ts`.
- Withdraw is gated by the contract (`is_account_unstaked_balance_available`),
  not by client-side clocks. Unbonding is 4 epochs (~7.5h each); UI countdown
  copy is an estimate only.
- Amounts: NEAR in the UI, yoctoNEAR on-chain (1 NEAR = 10²⁴). Input accepts
  both `.` and `,` decimals. Staking must leave ≥ 0.05 NEAR liquid for gas
  (`LIQUID_BUFFER_NEAR` in src/config.ts).

## Conventions

- Conventional commits (`feat:`, `fix(security):`, `docs(adr):`). Main is
  branch-protected — never push to main; work on a feature branch and open a
  PR.
- `internal/` is gitignored on purpose — never commit, link, or quote it in
  public files. Public architecture lives in `docs/adr/` + root `README.md`.
- Contract constants (pool id, RPC list, gas, buffers) live in `src/config.ts`
  — change them there, not inline.

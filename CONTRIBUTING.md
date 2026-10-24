# Contributing

Thanks for looking at this repo. It is a small, single-purpose app:
a self-custodial interface to stake, unstake, and withdraw NEAR on
`thecoding.pool.near`. Every balance-changing call is signed in the
user's wallet; the app holds no keys and runs as a static site.

Read [`docs/adr/`](docs/adr/README.md) before changing the staking
path. Changes that contradict an Accepted ADR need a new ADR in the
same change set.

## Prerequisites

- **Node 24.x** (`"engines"` in
  [`package.json`](package.json); Vercel's build image offers only the
  24.x and 22.x majors and auto-rolls security patches —
  [docs](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)).
  [`.nvmrc`](.nvmrc) pins 24.22.1 for local dev (`nvm use`)
- npm (any version that reads `package-lock.json` v3)

## Setup

```bash
git clone https://github.com/vinibarbosabr/thecoding-app.git
cd thecoding-app
npm install
npm run dev      # http://localhost:5173
```

No environment variables are needed. RPC endpoints are hardcoded in
[`src/config.ts`](src/config.ts) and no `VITE_*` values may enter the
bundle ([ADR-02](docs/adr/ADR-02.md), rule 2). There are no secrets to
configure.

## Repository layout

```text
src/
├── App.tsx                  # NearProvider (mainnet) + hash routing + shell
├── config.ts                # pool id, RPC endpoints, gas, buffers
├── lib/
│   ├── near.ts              # NEAR ↔ yoctoNEAR, decimal parsing, formatting
│   ├── pool.ts              # the six write builders + contract reads
│   ├── poolRead.ts          # public view calls (RPC fallback walk)
│   └── *.test.ts            # vitest, colocated
├── hooks/
│   ├── usePoolAccount.ts    # balances, fee, max stake (0.05 NEAR buffer)
│   ├── useTx.ts             # sign + send, pending/error/success states
│   └── *.test.ts
└── components/
    ├── PositionPanel.tsx    # ~/position: staked / unstaking / liquid
    ├── PoolStrip.tsx        # ~/pool: fee, total staked, apy, unbonding
    ├── JourneyPanel.tsx     # ~/actions: amount input, Max, writes
    ├── DataView.tsx         # #/data view (+ data/ panels)
    └── TxToast.tsx          # toast with NearBlocks transaction link
docs/
└── adr/                     # architecture decision records
```

## Dev workflow

- CI is one scheduled workflow, [data snapshots](.github/workflows/data-snapshots.yml)
  ([ADR-05](docs/adr/ADR-05.md)): it records epoch history into
  `public/data/epochs.json` and auto-merges the rolling data PR.
  No PR templates exist. Never hand-edit `epochs.json`;
  `npm run data:snapshot` regenerates it locally (read-only RPC).
- Commit history uses Conventional Commits
  (`feat:`, `fix:`, `docs:`, `chore:`); please keep that style.
- Work on a topic branch, open a PR against `main`.
- The app talks to **NEAR mainnet only** (`NETWORK` in
  [`src/config.ts`](src/config.ts)). There is no testnet mode, so
  manual testing moves real funds — prefer unit tests and code review
  for behavior changes.

## Tests

```bash
npm test        # vitest run, single pass
npm run test:watch
```

Current state: 123 tests in 11 files, all colocated with the module
they test (for example `src/lib/near.test.ts`, `src/lib/pool.test.ts`,
`src/lib/epochHistory.test.ts`, `src/hooks/usePoolAccount.test.ts`).
Real output from `npm test`:

```text
 Test Files  11 passed (11)
      Tests  123 passed (123)
```

To add tests, create `foo.test.ts` next to `foo.ts` and import from
vitest the same way the colocated files do. The pool builder tests in
[`src/lib/pool.test.ts`](src/lib/pool.test.ts) assert receiver
identity, 50 TGas, and method/args/deposit per builder — any new write
builder needs the same assertions.

## Code patterns

- **Add a pool write**: copy a builder in
  [`src/lib/pool.ts`](src/lib/pool.ts) (each returns an action with
  receiver, gas, and deposit), then add builder tests mirroring
  `pool.test.ts`.
- **Add a contract read**: copy a view helper in
  [`src/lib/poolRead.ts`](src/lib/poolRead.ts) (the RPC fallback walk),
  wire it through [`src/hooks/usePoolAccount.ts`](src/hooks/usePoolAccount.ts),
  render in [`src/components/PositionPanel.tsx`](src/components/PositionPanel.tsx).
- **Add a UI control**: copy [`JourneyPanel.tsx`](src/components/JourneyPanel.tsx)
  (amount validation, Max button, comma-decimal handling live there).

## Hard rules

1. **No key material in the app's trust boundary.** Never call
   `signIn({ addFunctionCallKey })`, `createLocalKeyFor`, or any API
   that writes a private key to `localStorage` ([ADR-02](docs/adr/ADR-02.md),
   rule 1).
2. **No backend.** No serverless functions in any path, read or write
   ([ADR-02](docs/adr/ADR-02.md), rule 2).
3. **No secrets.** Nothing passed to Vite via `VITE_*` ships to every
   visitor; only public values (RPC URLs) are allowed.
4. **Dependency changes on the signing path** are gated on
   `npm audit` reporting zero known vulnerabilities
   ([ADR-02](docs/adr/ADR-02.md), rule 4).

## Reporting a security issue

This app moves user funds. Please report vulnerabilities privately via
a [GitHub security advisory](https://github.com/vinibarbosabr/thecoding-app/security/advisories/new)
rather than a public issue.

## Help

- Issues: <https://github.com/vinibarbosabr/thecoding-app/issues>
- Architecture questions: start from [`docs/adr/README.md`](docs/adr/README.md)

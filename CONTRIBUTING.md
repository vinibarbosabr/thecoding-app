# Contributing

Thanks for looking at this repo. It is a small, single-purpose app:
a self-custodial interface to stake, unstake, and withdraw NEAR on
`thecoding.pool.near`. Every balance-changing call is signed in the
user's wallet; the app holds no keys and runs as a static site.

Read [`docs/adr/`](docs/adr/README.md) before changing the staking
path. Changes that contradict an Accepted ADR need a new ADR in the
same change set.

## Prerequisites

- **Node 22.12 or newer** (`"engines"` in [`package.json`](package.json);
  the test stack requires `^22.12 || ^24 || >=26`)
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
├── App.tsx                  # NearProvider (mainnet) + page wiring
├── config.ts                # pool id, RPC endpoints, gas, buffers
├── lib/
│   ├── near.ts              # NEAR ↔ yoctoNEAR, decimal parsing, formatting
│   ├── pool.ts              # the six write builders + contract reads
│   └── *.test.ts            # vitest, colocated
├── hooks/
│   ├── usePoolAccount.ts    # balances, fee, max stake (0.05 NEAR buffer)
│   ├── useTx.ts             # sign + send, pending/error/success states
│   ├── useTheme.ts          # light/dark toggle
│   └── *.test.ts
└── components/
    ├── ConnectBar.tsx       # connect / disconnect, signed-in account
    ├── PositionCard.tsx     # staked / unstaking / liquid buckets
    ├── AmountForm.tsx       # amount input, Max, validation
    └── TxToast.tsx          # toast with NearBlocks transaction link
docs/
└── adr/                     # architecture decision records
```

## Dev workflow

- **No CI workflows or PR templates exist in this repo** (no
  `.github/` directory). Commit history uses Conventional Commits
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

Current state: 32 tests in 3 files, all colocated with the module
they test (`src/lib/near.test.ts`, `src/lib/pool.test.ts`,
`src/hooks/usePoolAccount.test.ts`). Real output from `npm test` on
Node v26.7.0:

```text
 Test Files  3 passed (3)
      Tests  32 passed (32)
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
  [`src/lib/pool.ts`](src/lib/pool.ts) (for example `get_account`),
  wire it through [`src/hooks/usePoolAccount.ts`](src/hooks/usePoolAccount.ts),
  render in [`src/components/PositionCard.tsx`](src/components/PositionCard.tsx).
- **Add a UI control**: copy [`AmountForm.tsx`](src/components/AmountForm.tsx)
  (validation, Max button, comma-decimal handling come with it).

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

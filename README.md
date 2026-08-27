# thecoding.pool.near

Clean, self-custodial interface to interact with the **`thecoding.pool.near`** NEAR validator.

Connect a NEAR wallet, sign one transaction per action. The app never holds keys and never stakes on anyone's behalf.

**v1.0.0:** connect → stake → unstake → withdraw.

Not in v1: validator dashboard, NEAR Intents, EVM/Solana wallets, delegator points.

Decisions: [`docs/ADR-01.md`](docs/ADR-01.md) · reasoning: [`STRATEGY.md`](STRATEGY.md)

---

## How it works

NEAR pool methods must be signed by the **delegator**. If a server called `deposit_and_stake`, the stake would sit on the server account.

```
wallet ──sign──► FunctionCall ──► thecoding.pool.near
                 ▲
app builds the call, then reads state back via RPC view
```

1. Connect with NEAR Connect (HOT, Meteor, MyNearWallet, Nightly, Intear, NEAR Mobile, …).
2. App reads `get_account` and pool fee/total from a public RPC.
3. You enter an amount (`.` or `,` accepted).
4. Wallet signs. App does not broadcast through a backend.
5. UI refetches until balances move.

---

## Pool contract

Network: **mainnet**. Contract: **`thecoding.pool.near`**.

### Writes (user signs, 50 TGas)

| UI | Method | Attached deposit | Args |
| --- | --- | --- | --- |
| Stake | `deposit_and_stake` | amount (yoctoNEAR) | `{}` |
| Unstake amount | `unstake` | 0 | `{ "amount": "<yocto>" }` |
| Unstake max | `unstake_all` | 0 | `{}` |
| Withdraw amount | `withdraw` | 0 | `{ "amount": "<yocto>" }` |
| Withdraw max | `withdraw_all` | 0 | `{}` |

Never attach deposit to unstake/withdraw. Never send amount `0`.

### Reads (no signature)

Primary: `get_account` (staked, unstaked, `unstaked_available_epoch_height` / withdrawability).

Also: `get_account_staked_balance`, `get_account_unstaked_balance`, `get_account_total_balance`, `is_account_unstaked_balance_available`, `get_reward_fee_fraction`, `get_total_staked_balance`, `get_owner_id`.

Units: **1 NEAR = 10²⁴ yoctoNEAR**. The form talks NEAR; the call sends yocto.

### Unbonding

Unlock is **not** `Date.now() + 48h`.

- Button state = `is_account_unstaked_balance_available` / account `can_withdraw`.
- Copy = “4 epochs (about 2 days).”
- Remaining epochs, when shown, come from `unstaked_available_epoch_height` vs current `epoch_height`.

---

## Stack (v1, approved)

| Layer | Choice |
| --- | --- |
| App | Vite + React 19 + TypeScript (strict) |
| Style | Tailwind CSS, dark-first |
| Wallet | `near-connect-hooks` → `@hot-labs/near-connect` |
| RPC | FastNEAR (`https://free.rpc.fastnear.com`), official fallback |
| Package manager | pnpm |
| Host | Vercel (static). Railway only when a worker/DB exists |
| License | MIT |

Rust is reserved for later workers / an operator CLI. Not the wallet UI.

### Dependencies

```text
near-connect-hooks
@hot-labs/near-connect
near-api-js
react
react-dom
```

Dev: `vite`, `typescript`, `tailwindcss`, `vitest` (amount parse/validate only in v1).

---

## Repo layout

```text
thecoding-pool-app/
├── README.md
├── STRATEGY.md
├── docs/
│   ├── ADR-01.md
│   └── roadmap.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── config.ts              # pool id, network, RPC, gas
    ├── lib/
    │   ├── near.ts            # yocto, commas, 0.05 NEAR gas buffer
    │   └── pool.ts            # views + action builders
    ├── hooks/
    │   └── usePoolAccount.ts
    └── components/
        ├── WalletButton.tsx
        ├── StakeForm.tsx
        ├── UnstakeForm.tsx
        ├── WithdrawForm.tsx
        └── AccountSummary.tsx
```

App boots on mainnet defaults with no env file. Overrides are optional `VITE_*` (see `.env.example` once scaffolded).

---

## Safety

- No keys, no seed phrases, no server-side predecessor.
- Validate amount **before** opening the wallet: `> 0`, `≤` available, and stake leaves **≥ 0.05 NEAR** liquid for gas.
- Withdraw stays disabled until the contract says the unstaked balance is available.
- Public preview can be read-only via `VITE_ENABLE_WRITES=false`.
- Repo is MIT so delegators can read the exact call they sign.

---

## Scripts (once scaffolded)

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # parse / validate units
pnpm build
```

First real write is a **0.1 NEAR** `deposit_and_stake` from an account Vini controls. Not CI. Not an agent.

---

## Roadmap (not v1)

| After v1 | What |
| --- | --- |
| v1.1 | Pool snapshot in the UI (fee, total stake, owner) — views only |
| v1.2 | Custom domain |
| v2 | NEAR Intents (e.g. USDC on Base → stake here) |
| v2+ | Delegator points, other-chain wallets |

Intents is a new flow (quote → origin deposit → solve → stake). It is not a swapped wallet adapter. Do not abstract v1 for it.

---

## Gates

Approved 2026-08-27: Vercel, Vite+TS+React, NEAR Connect, this contract table.

Still gated:

1. Create the git remote and push.
2. Create the Vercel project.
3. First non-zero mainnet tx against `thecoding.pool.near`.
4. Custom domain / DNS.

---

## License

MIT

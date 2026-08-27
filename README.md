# thecoding app

Clean, self-custodial interface to interact with the **`thecoding.pool.near`** NEAR validator.

Users connect their NEAR wallet, enter an amount, and sign the transaction themselves. The app builds the correct `deposit_and_stake` / `unstake` / `withdraw` call against the pool contract — a user's keys never leave their wallet.

> **v1.0.0 scope.** Something in the roadmap is deliberately small: connect wallet → stake → unstake → withdraw (after the ~48h unbonding period). Cross-chain wallets via NEAR Intents, a validator metrics dashboard, and a delegator points program are planned but out of scope for v1.

---

## Features (v1.0.0)

- **Connect NEAR wallet** via [NEAR Connect](https://github.com/azbang/near-connect) (`@hot-labs/near-connect`) — sandboxed, manifest-based wallet modal.
- **Stake** — input NEAR, sign `deposit_and_stake` on `thecoding.pool.near`.
- **Unstake** — sign `unstake`, then see a live countdown through the ~48h (4-epoch) unbonding period.
- **Withdraw** — once unbonded, sign `withdraw` to get NEAR back to your wallet.
- **Balances** — staked, unstaked (withdrawable), and total, plus pool metrics (total staked, reward fee), polled from RPC.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Wallet | `@hot-labs/near-connect` + `near-connect-hooks` |
| RPC / view calls | `near-api-js` (`JsonRpcProvider`) |
| Testing | Vitest, Playwright (testnet wallet flows) |

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment (copy and fill in)
cp .env.example .env.local

# 3. Run dev (mainnet default; set NEXT_PUBLIC_NEAR_NETWORK=testnet for testnet)
npm run dev
```

## Configuration

`.env.local`

```env
NEXT_PUBLIC_NEAR_NETWORK=mainnet        # or testnet
NEXT_PUBLIC_POOL_CONTRACT_ID=thecoding.pool.near
NEXT_PUBLIC_RPC_URL=https://rpc.mainnet.near.org
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Staking contract reference

Target: **`thecoding.pool.near`** (NEAR staking-pool contract)

| Action | Method | Notes |
| --- | --- | --- |
| Stake | `deposit_and_stake` | deposit = full amount (yoctoNEAR), ~30 TGas |
| Unstake | `unstake` | `{ amount }`, no deposit |
| Withdraw | `withdraw` | `{ amount }`, only after ~48h unbonding |
| Staked balance | `get_account_staked_balance` | view |
| Unstaked balance | `get_account_unstaked_balance` | view |
| Total balance | `get_account_total_balance` | view |
| Pool total | `get_total_staked_balance` | view |
| Reward fee | `get_reward_fee_fraction` | view |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright wallet-flow tests (testnet) |

## Roadmap (explicitly not v1)

- Validator/node metrics dashboard.
- Cross-chain wallets (EVM, Solana) with stake routed through **NEAR Intents** (e.g. USDC on Base → stake NEAR).
- Points program for long-time delegators.
- See [`docs/roadmap.md`](docs/roadmap.md).

## License

**UNLICENSED** until chosen (owner: thecoding.dev).

---

_Maintained as part of the thecoding.dev validator operations. Built by the Execution instance for thecoding.dev; deploys are gated on owner approval._


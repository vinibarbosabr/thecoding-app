# ADR-01 — Self-custodial v1 staking UI

**Status:** Accepted
**Date:** 2026-08-27
**Recorded in-repo:** 2026-09-09

## Context

Delegators need a browser interface to stake, unstake, and withdraw NEAR
on `thecoding.pool.near` without handing keys to the validator operator.

NEAR staking-pool writes credit the **predecessor account** of the
transaction. A server that called `deposit_and_stake` would become the
staker. That is a custodial product. This project is not that product.

v1 must be readable by someone about to stake real NEAR: which
contract is called, which methods, who signs, and when withdrawn funds
become available.

## Decision

### 1. Custody

- The app holds no keys and never asks for a seed phrase.
- Every balance-changing call is signed in the user's wallet.
- The app builds the `FunctionCall` and reads public view methods.
- There is no backend in the staking path. A static host serves the
  UI. Views go to a public RPC.

### 2. Contract

- Network: NEAR mainnet.
- Receiver for all writes: `thecoding.pool.near`.
- Writes, each at 50 TGas:

  | Action | Method | Deposit | Args |
  | --- | --- | --- | --- |
  | Stake (new funds) | `deposit_and_stake` | stake amount (yoctoNEAR) | `{}` |
  | Restake (from unstaked bucket) | `stake` | none | `{ "amount": "<yocto>" }` |
  | Unstake amount | `unstake` | none | `{ "amount": "<yocto>" }` |
  | Unstake all | `unstake_all` | none | `{}` |
  | Withdraw amount | `withdraw` | none | `{ "amount": "<yocto>" }` |
  | Withdraw all | `withdraw_all` | none | `{}` |

- Primary read: `get_account`.
- Withdrawability: `is_account_unstaked_balance_available` (and the
  corresponding field on `get_account`).
- The UI will not attach deposit to unstake/withdraw and will not
  submit amount `0`.

### 3. Unbonding

- After `unstake`, funds are locked for **4 epochs** (~7.5 hours each
  on current mainnet).
- The Withdraw control is enabled only when the pool reports the
  unstaked balance as available.
- Any countdown in the UI is explanatory. The contract is the gate.

### 4. Wallet and RPC

- Wallet connector: NEAR Connect
  (`@hot-labs/near-connect` + `near-connect-hooks`).
- The connector is initialized on **mainnet** explicitly. The library
  default is testnet; that default must not ship.
- RPC: FastNEAR public endpoint first, official mainnet RPC as
  fallback. The app does not run a node for v1.

### 5. Client checks before the wallet popup

- Parse amounts in NEAR; send yoctoNEAR (1 NEAR = 10²⁴ yoctoNEAR).
- Accept both `.` and `,` as the decimal mark.
- Reject empty, zero, and above-available amounts.
- Refuse a stake that would leave the wallet with less than
  **0.05 NEAR** liquid, so the account can still pay gas.

### 6. Implementation shape

- Language: TypeScript.
- UI: Vite + React + Tailwind CSS.
- One page: connect, balances, stake, unstake, withdraw.
- License: MIT. Delegators can read the call the wallet will show.

### 7. v1 scope

In: connect, stake, unstake, withdraw, pool fee and totals from view
methods.

Out: application servers that submit pool calls, Intents / other-chain
wallets, delegator points, a validator operations dashboard.

## Consequences

- A reviewer can check `src/lib/pool.ts` (once present) against this
  table. Receiver, method, and deposit must match.
- Adding a “submit this signed payload on our server” path would
  contradict this ADR and needs a new one — it would also change
  custody.
- Later features (Intents, points) are separate flows. They must not
  be used to introduce a server that becomes the predecessor on
  `thecoding.pool.near`.
- Hosting and CI choices that do not change custody are operational
  and are not recorded here.

## Supersedes / References

- Pool contract: [NEAR staking](https://docs.near.org/protocol/network/staking)
- Wallet: [NEAR Connect](https://docs.near.org/tools/near-connect)
- Account on NearBlocks: [thecoding.pool.near](https://nearblocks.io/address/thecoding.pool.near)

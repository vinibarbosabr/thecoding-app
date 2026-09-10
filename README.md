# thecoding.pool.near

Self-custodial interface to stake, unstake, and withdraw NEAR on
[`thecoding.pool.near`](https://nearblocks.io/address/thecoding.pool.near).

You connect a NEAR wallet and sign each action yourself. This app never
asks for a seed phrase, never stores a private key, and never submits a
pool call from a server account.

**v1:** connect → stake → unstake → withdraw.

Architecture: [`docs/adr/ADR-01.md`](docs/adr/ADR-01.md).

---

## Why this design

On NEAR, `deposit_and_stake`, `unstake`, and `withdraw` credit the
**predecessor** — the account that signed the transaction.

If a backend sent those calls, the stake would sit on the backend
account, not yours. That would be custody. This app does not do that.

```
your wallet  ── signs ──►  FunctionCall  ──►  thecoding.pool.near
                              ▲
              this app only builds the call
              and reads public view methods
```

You can confirm the receiver and method in your wallet before you
approve. After source lands, the builders live in `src/lib/pool.ts`.

---

## Pool contract

- Network: **NEAR mainnet**
- Contract: **`thecoding.pool.near`** (standard staking-pool)
- Amounts in the UI: NEAR. Amounts on-chain: yoctoNEAR
  (1 NEAR = 10²⁴ yoctoNEAR)

### Writes (your wallet signs)

| Action | Method | Attached deposit | Arguments |
| --- | --- | --- | --- |
| Stake (new funds) | `deposit_and_stake` | the stake amount | `{}` |
| Restake (from unstaked bucket) | `stake` | none | `{ "amount": "<yoctoNEAR>" }` |
| Unstake an amount | `unstake` | none | `{ "amount": "<yoctoNEAR>" }` |
| Unstake all | `unstake_all` | none | `{}` |
| Withdraw an amount | `withdraw` | none | `{ "amount": "<yoctoNEAR>" }` |
| Withdraw all | `withdraw_all` | none | `{}` |

Prepaid gas on each write: 50 TGas. Unstake and withdraw never attach
NEAR. The app will not submit an amount of `0`.

### Reads (no signature)

Primary: `get_account` — staked balance, unstaked balance, and when
unstaked funds become withdrawable.

Also used: `is_account_unstaked_balance_available`,
`get_account_staked_balance`, `get_account_unstaked_balance`,
`get_account_total_balance`, `get_reward_fee_fraction`,
`get_total_staked_balance`, `get_owner_id`.

### Unbonding

Unstaking does not return NEAR immediately. The pool requires **4 epochs
(~7.5 hours each)** before a withdraw is allowed.

The Withdraw control follows the contract
(`is_account_unstaked_balance_available` / account withdrawability),
not a clock in the browser. Copy in the UI is an estimate; the
contract is the gate.

---

## What you should see in the wallet popup

- **Receiver:** `thecoding.pool.near`
- **Method:** one of the six writes above
- **Deposit:** only on `deposit_and_stake`, equal to the amount you typed
- **No other receivers** in that transaction

If a popup shows a different contract, a transfer to an unknown
account, or a method that is not in the table, reject it.

---

## Safety rules the UI enforces

- Amount must be greater than zero and within the available balance.
- Stake leaves at least **0.05 NEAR** liquid on the wallet so later
  transactions can pay gas.
- Withdraw stays disabled until the pool reports the unstaked balance
  as available.
- Decimal input accepts both `1.5` and `1,5`.

This software is MIT-licensed and provided as-is. Read
[`LICENSE`](LICENSE). Staking has protocol risk (validator performance,
unbonding delay, smart-contract risk of the official pool). This UI
does not change those.

---

## Stack (v1)

| Layer | Choice |
| --- | --- |
| UI | Vite + React + TypeScript |
| Wallet | [NEAR Connect](https://docs.near.org/tools/near-connect) (`@hot-labs/near-connect`, `near-connect-hooks`) |
| Views | Public RPC (FastNEAR, with fallback) |
| Host | Static site — no server in the staking path |
| License | MIT |

---

## Repository layout

```text
README.md
LICENSE
docs/
├── README.md
└── adr/
    ├── README.md
    └── ADR-01.md
src/                          # v1 application (forthcoming)
├── config.ts
├── lib/near.ts
├── lib/pool.ts
├── hooks/usePoolAccount.ts
└── components/…
```

---

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

Mainnet is the default network. Optional `VITE_*` overrides will be
documented in `.env.example` when the app is scaffolded.

---

## Out of scope for v1

- A server that stakes, unstakes, or withdraws for you
- Cross-chain wallets and NEAR Intents
- Delegator points
- A full validator-operations dashboard

Those may appear in later versions. They do not change v1 custody:
your key still signs the pool call.

---

## License

[MIT](LICENSE)

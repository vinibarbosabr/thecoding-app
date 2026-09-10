import { NearProvider, useNearWallet } from "near-connect-hooks";
import { NETWORK, RPC_URLS, LIQUID_BUFFER_NEAR } from "./config";
import { ConnectBar } from "./components/ConnectBar";
import { PositionCard } from "./components/PositionCard";
import { AmountForm } from "./components/AmountForm";
import { TxToast } from "./components/TxToast";
import { usePoolAccount, maxStakeNear } from "./hooks/usePoolAccount";
import { useTx } from "./hooks/useTx";
import { useTheme } from "./hooks/useTheme";
import {
  stakeBuilder,
  restakeBuilder,
  unstakeBuilder,
  unstakeAllBuilder,
  withdrawBuilder,
  withdrawAllBuilder,
} from "./lib/pool";
import { nearToYocto, yoctoToNear } from "./lib/near";

export default function App() {
  return (
    <NearProvider config={{ network: NETWORK, providers: { mainnet: RPC_URLS } }}>
      <Shell />
    </NearProvider>
  );
}

function Shell() {
  const wallet = useNearWallet();
  const connected = Boolean(wallet.signedAccountId);
  const position = usePoolAccount();
  const tx = useTx(position.refetch);
  const { theme, toggle } = useTheme();

  const stakedNear = yoctoToNear(position.staked);
  const unstakedNear = yoctoToNear(position.unstaked);
  const maxStake = maxStakeNear(position.liquid);

  const handle = (builder: (yocto: string) => any[]) => (amountNear: string) => {
    const yocto = nearToYocto(amountNear);
    tx.sign(builder(yocto));
  };

  const handleAll = (builder: () => any[]) => () => tx.sign(builder());

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#042F2E]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <img
              src="/logo-light.png"
              alt="thecoding.pool.near"
              className="h-10 w-auto dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="thecoding.pool.near"
              className="hidden h-10 w-auto dark:block"
            />
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            Self-custodial staking on{" "}
            <a
              href="https://nearblocks.io/address/thecoding.pool.near"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-emerald-600 underline"
            >
              thecoding.pool.near
            </a>
            . You sign every action in your wallet.
          </p>
        </header>

        <ConnectBar />

        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Your position
          </h2>
          <PositionCard position={position} connected={connected} />
        </section>

        {connected && (
          <section className="space-y-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Actions
            </h2>

            <AmountForm
              label="Stake"
              actionLabel="Stake"
              maxNear={maxStake}
              disabled={tx.pending || maxStake <= 0}
              pending={tx.pending}
              accent="emerald"
              extraNote={`Keeps ≥ ${LIQUID_BUFFER_NEAR} NEAR liquid for gas`}
              onSubmit={handle(stakeBuilder)}
            />

            <AmountForm
              label="Unstake"
              actionLabel="Unstake"
              maxNear={stakedNear}
              disabled={tx.pending || stakedNear <= 0}
              pending={tx.pending}
              accent="amber"
              extraNote="Unstaked funds lock for ~4 epochs (~7.5h each) before withdrawal"
              onSubmit={handle(unstakeBuilder)}
            />

            {(stakedNear > 0 || unstakedNear > 0) && (
              <div className="flex gap-2">
                {stakedNear > 0 && (
                  <button
                    onClick={handleAll(unstakeAllBuilder)}
                    disabled={tx.pending}
                    className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-40"
                  >
                    Unstake all
                  </button>
                )}
                {unstakedNear > 0 && (
                  <button
                    onClick={handleAll(withdrawAllBuilder)}
                    disabled={tx.pending || !position.withdrawalAvailable}
                    className="flex-1 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:opacity-40"
                  >
                    Withdraw all
                  </button>
                )}
              </div>
            )}

            {unstakedNear > 0 && position.withdrawalAvailable && (
              <AmountForm
                label="Withdraw"
                actionLabel="Withdraw"
                maxNear={unstakedNear}
                disabled={tx.pending || !position.withdrawalAvailable}
                pending={tx.pending}
                accent="sky"
                extraNote="Moves funds from the pool back to your wallet"
                onSubmit={handle(withdrawBuilder)}
            />
            )}

            {unstakedNear > 0 && position.withdrawalAvailable && (
              <AmountForm
                label="Restake"
                actionLabel="Restake"
                maxNear={unstakedNear}
                disabled={tx.pending || !position.withdrawalAvailable}
                pending={tx.pending}
                accent="emerald"
                extraNote="Re-stakes withdrawable funds without a new deposit"
                onSubmit={handle(restakeBuilder)}
              />
            )}
          </section>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400 dark:border-neutral-700">
          <p>
            This app builds the transaction; your wallet signs it. The receiver is always{" "}
            <span className="font-mono">thecoding.pool.near</span>. Reject any popup showing a
            different contract.
          </p>
        </footer>
      </div>

      <TxToast hash={tx.lastTxHash} pending={tx.pending} error={tx.error} />
    </div>
  );
}

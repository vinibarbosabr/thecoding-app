import { useNearWallet } from "near-connect-hooks";
import { POOL_ID } from "../config";
import { Btn } from "./ui/Btn";
import { Chip, ChipDot } from "./ui/Chip";
import { AccountChip } from "./AccountChip";

export function SiteHeader({ onToggleTheme }: { onToggleTheme: () => void }) {
  const wallet = useNearWallet();
  const accountId = wallet.signedAccountId;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-2.5">
        <h1 className="flex items-center font-mono text-lg font-semibold leading-[1.2] tracking-[0.01em] max-[520px]:text-base">
          <span className="font-normal text-signal-ink">[</span>
          thecoding
          <span className="font-normal text-signal-ink">]</span>
          <span className="font-normal text-ink-40">.pool.near</span>
          <span className="cursor-blink" aria-hidden="true" />
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Chip>
            <ChipDot />
            mainnet
          </Chip>
          {wallet.loading ? null : accountId ? (
            <AccountChip accountId={accountId} />
          ) : (
            <Btn onClick={() => wallet.signIn()}>connect wallet</Btn>
          )}
          <Btn
            variant="quiet"
            icon
            aria-label="switch theme"
            title="switch theme"
            onClick={onToggleTheme}
          >
            ◐
          </Btn>
        </div>
      </div>
      <p className="text-[13px] leading-normal text-ink-70">
        self-custodial staking on{" "}
        <a
          href={`https://nearblocks.io/address/${POOL_ID}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-signal-ink underline decoration-ink-25 underline-offset-[3px] hover:decoration-signal-ink"
        >
          {POOL_ID}
        </a>
        . you keep the keys: the app only builds transactions and your wallet
        signs them.
      </p>
    </header>
  );
}

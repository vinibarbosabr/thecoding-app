import { useNearWallet } from "near-connect-hooks";
import { Btn } from "./ui/Btn";
import { Chip, ChipDot } from "./ui/Chip";
import { AccountChip } from "./AccountChip";

export function SiteHeader({ onToggleTheme }: { onToggleTheme: () => void }) {
  const wallet = useNearWallet();
  const accountId = wallet.signedAccountId;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-2.5">
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
    </header>
  );
}

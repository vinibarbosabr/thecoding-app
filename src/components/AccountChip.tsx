import { useState } from "react";
import { useNearWallet } from "near-connect-hooks";
import { Btn } from "./ui/Btn";
import { truncateAccountId } from "../lib/format";

export function AccountChip({ accountId }: { accountId: string }) {
  const wallet = useNearWallet();
  const isEth = accountId.startsWith("0x");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard
      ?.writeText(accountId)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 900);
      })
      .catch(() => {});
  };

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip border border-ink-25 px-2.5 py-[5px] font-mono text-[11px] leading-none text-ink-70 transition duration-[120ms] hover:border-ink-40 hover:text-ink">
          <span className="inline-block max-w-[38vw] truncate align-bottom font-mono">
            {isEth ? truncateAccountId(accountId) : accountId}
          </span>
          <span aria-hidden="true" className="text-[9px] text-ink-40">
            ▾
          </span>
        </span>
        <span className="sr-only">account details</span>
      </summary>
      <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[min(88vw,340px)] rounded-panel border border-ink-40 bg-surface p-4 shadow-pop">
        <div className="font-mono text-[10px] leading-none lowercase tracking-[0.08em] text-ink-40">
          {isEth ? "account · eth-implicit" : "account"}
        </div>
        <div className="mb-1 mt-1.5 break-all font-mono text-xs leading-[1.5] text-ink">
          {accountId}
        </div>
        <p className="mb-3 mt-1 text-[11.5px] leading-[1.5] text-ink-60">
          {isEth
            ? "ethereum wallet connected via near's evm-on-near. this is your near account id: funds are on mainnet."
            : "wallet connected. you sign every action."}
        </p>
        <div className="flex gap-2">
          <Btn variant="quiet" size="sm" onClick={copy}>
            {copied ? "copied ✓" : "copy id"}
          </Btn>
          <Btn variant="quiet" size="sm" onClick={() => wallet.signOut()}>
            disconnect
          </Btn>
        </div>
      </div>
    </details>
  );
}

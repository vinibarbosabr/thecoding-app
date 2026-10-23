import { POOL_ID } from "../../config";

/**
 * The custody promise, shared by the hub and data view intro blocks
 * (ADR-04 §1): each surface opens with a LeadLink and this note side
 * by side above the first panel.
 */
export function CustodyNote() {
  return (
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
  );
}

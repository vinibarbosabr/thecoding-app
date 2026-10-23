import { NodePanel } from "./data/NodePanel";
import { NetworkPanel } from "./data/NetworkPanel";
import { HistoryPanel } from "./data/HistoryPanel";
import { IssuancePanel } from "./data/IssuancePanel";
import { LeadLink } from "./ui/LeadLink";
import { CustodyNote } from "./ui/CustodyNote";

export function DataView() {
  return (
    <div>
      <nav
        aria-label="data view"
        className="mt-[22px] grid items-center gap-4 [grid-template-columns:auto_minmax(0,1fr)] max-[520px]:grid-cols-1 max-[520px]:gap-3.5"
      >
        <LeadLink
          href="#/"
          back
          title="staking hub"
          description="back to stake, unstake, and withdraw"
        />
        <CustodyNote />
      </nav>
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[11px] leading-none">
        <span className="tracking-[0.06em] text-ink-60">~/data</span>
        <span className="text-ink-40">live · read-only</span>
      </div>
      <NodePanel />
      <NetworkPanel />
      <HistoryPanel />
      <IssuancePanel />
    </div>
  );
}

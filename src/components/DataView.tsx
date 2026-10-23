import { NodePanel } from "./data/NodePanel";
import { NetworkPanel } from "./data/NetworkPanel";
import { HistoryPanel } from "./data/HistoryPanel";
import { IssuancePanel } from "./data/IssuancePanel";
import { LeadLink } from "./ui/LeadLink";

export function DataView() {
  return (
    <div>
      <nav aria-label="data view" className="mt-[22px]">
        <LeadLink
          href="#/"
          back
          title="staking hub"
          description="back to stake, unstake, and withdraw"
        />
        <div className="mt-2.5 flex flex-wrap items-baseline gap-2.5 font-mono text-[11px] leading-none">
          <span className="tracking-[0.06em] text-ink-60">~/data</span>
          <span className="ml-auto text-ink-40">live · read-only</span>
        </div>
      </nav>
      <NodePanel />
      <NetworkPanel />
      <HistoryPanel />
      <IssuancePanel />
    </div>
  );
}

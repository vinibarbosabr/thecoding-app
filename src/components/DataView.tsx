import { NodePanel } from "./data/NodePanel";
import { NetworkPanel } from "./data/NetworkPanel";
import { HistoryPanel } from "./data/HistoryPanel";
import { IssuancePanel } from "./data/IssuancePanel";

export function DataView() {
  return (
    <div>
      <nav
        aria-label="data view"
        className="mt-[22px] flex flex-wrap items-center gap-2.5 font-mono text-[11px] leading-none"
      >
        <a
          href="#/"
          className="text-signal-ink underline decoration-ink-25 underline-offset-[3px] transition duration-[120ms] hover:decoration-signal-ink"
        >
          ← staking hub
        </a>
        <span aria-hidden="true" className="text-ink-25">
          ·
        </span>
        <span className="tracking-[0.06em] text-ink-60">~/data</span>
        <span className="ml-auto text-ink-40">live · read-only</span>
      </nav>
      <NodePanel />
      <NetworkPanel />
      <HistoryPanel />
      <IssuancePanel />
    </div>
  );
}

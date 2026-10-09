import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Panel } from "./ui/Panel";
import { Chip } from "./ui/Chip";
import { getRewardFeeFraction, getTotalStakedBalance } from "../lib/pool";
import { publicView } from "../lib/poolRead";
import { formatNear } from "../lib/near";
import { EPOCH_HOURS_ESTIMATE, UNBONDING_EPOCHS } from "../config";

function Cell({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 font-mono text-xs leading-none">
      <span className="text-[11px] text-ink-60">{label}</span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
      <span className="text-[10px] text-ink-60">{sub}</span>
    </div>
  );
}

export function PoolStrip() {
  const [fee, setFee] = useState<{ numerator: number; denominator: number } | null>(
    null,
  );
  const [totalStaked, setTotalStaked] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [f, t] = await Promise.all([
          getRewardFeeFraction(publicView),
          getTotalStakedBalance(publicView),
        ]);
        if (cancelled) return;
        setFee(f);
        setTotalStaked(t);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unbondHours = UNBONDING_EPOCHS * EPOCH_HOURS_ESTIMATE;

  return (
    <Panel title="~/pool" ariaLabel="pool" status={<Chip>read: rpc</Chip>}>
      <div className="grid justify-start gap-x-7 gap-y-2 [grid-template-columns:repeat(3,auto)] max-[520px]:[grid-template-columns:1fr]">
        <Cell
          label="fee"
          value={fee ? `${((fee.numerator / fee.denominator) * 100).toFixed(1)}%` : "…"}
          sub="of rewards"
        />
        <Cell
          label="total staked"
          value={totalStaked ? `${formatNear(totalStaked)} Ⓝ` : "…"}
          sub="all delegators"
        />
        <Cell
          label="unbonding"
          value={`${UNBONDING_EPOCHS} epochs`}
          sub={`~${unbondHours}h · protocol`}
        />
      </div>
      {failed && (
        <p className="mt-3 font-mono text-xs text-error">
          pool stats unavailable right now.
        </p>
      )}
    </Panel>
  );
}

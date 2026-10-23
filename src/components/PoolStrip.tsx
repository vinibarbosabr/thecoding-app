import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Panel } from "./ui/Panel";
import { Chip } from "./ui/Chip";
import { fetchPoolStats, fetchValidators } from "../lib/networkRead";
import {
  annualizedApyPercent,
  netApyPercent,
  prevEpochStake,
  toBig,
} from "../lib/metrics";
import type { FeeFraction } from "../lib/metrics";
import { formatNear } from "../lib/near";
import { POOL_ID, EPOCH_HOURS_ESTIMATE, UNBONDING_EPOCHS } from "../config";

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
  const [fee, setFee] = useState<FeeFraction | null>(null);
  const [totalStaked, setTotalStaked] = useState<string | null>(null);
  const [apy, setApy] = useState<number | null>(null);
  const [epochHeight, setEpochHeight] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await fetchPoolStats();
        if (cancelled) return;
        setFee(stats.fee);
        setTotalStaked(stats.totalStaked);
        // epoch apy: prev-epoch reward over its derived base stake,
        // annualized, net of the pool fee. estimates stay quiet on failure.
        try {
          const v = await fetchValidators();
          if (cancelled) return;
          const reward = toBig(v.validator_reward_paid_prev_epoch?.[POOL_ID] ?? "0");
          const gross = annualizedApyPercent(
            reward,
            prevEpochStake(toBig(stats.totalStaked), reward),
          );
          setApy(gross === null ? null : netApyPercent(gross, stats.fee));
          setEpochHeight(v.epoch_height);
        } catch {
          /* apy unavailable right now; other cells still render */
        }
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
    <Panel
      title="~/pool"
      ariaLabel="pool"
      status={<Chip>read: rpc</Chip>}
      foot={
        <>
          {epochHeight !== null && <span>epoch {epochHeight}</span>}
          <a
            href="#/data"
            className="text-signal-ink underline decoration-ink-25 underline-offset-[3px] transition duration-[120ms] hover:decoration-signal-ink"
          >
            node & network data →
          </a>
        </>
      }
    >
      <div className="grid justify-start gap-x-7 gap-y-2 [grid-template-columns:repeat(4,auto)] max-[520px]:[grid-template-columns:repeat(2,auto)]">
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
          label="epoch apy"
          value={apy !== null ? `~${apy.toFixed(2)}%` : "…"}
          sub="est · net of fee"
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

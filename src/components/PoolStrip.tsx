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
import { formatNearCompact } from "../lib/near";
import { POOL_ID, EPOCH_HOURS_ESTIMATE, UNBONDING_EPOCHS } from "../config";

function StatCell({ top, label }: { top: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 font-mono leading-none">
      <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink">
        {top}
      </span>
      <span className="whitespace-nowrap text-[10px] text-ink-60">{label}</span>
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
        // apy: prev-epoch reward over its derived base stake,
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
      <div className="grid grid-cols-[repeat(4,auto)] justify-between gap-x-4 gap-y-3.5 max-[520px]:grid-cols-[repeat(2,auto)]">
        <StatCell
          label="of rewards"
          top={
            <>
              <span className="text-[11px] font-normal text-ink-60">fee</span>{" "}
              {fee ? `${((fee.numerator / fee.denominator) * 100).toFixed(1)}%` : "…"}
            </>
          }
        />
        <StatCell
          label="total staked"
          top={totalStaked ? `${formatNearCompact(totalStaked)} Ⓝ` : "…"}
        />
        <StatCell
          label="est. apy"
          top={apy !== null ? `~${apy.toFixed(2)}%` : "…"}
        />
        <StatCell
          label="unbonding time"
          top={
            <>
              <span className="font-semibold">{UNBONDING_EPOCHS} epochs</span>{" "}
              <span className="font-normal text-ink-60">(~{unbondHours}h)</span>
            </>
          }
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

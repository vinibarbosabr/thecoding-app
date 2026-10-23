import { useEffect, useState } from "react";
import { Panel } from "../ui/Panel";
import { Chip } from "../ui/Chip";
import { StatRow } from "../ui/StatRow";
import {
  fetchNetworkStats,
  fetchProtocolConfig,
  fetchValidators,
} from "../../lib/networkRead";
import { stakedRatioPercent, sumStakes } from "../../lib/metrics";
import { HSP029_TARGET_RATE, HSP029_URL } from "../../config";

type IssuanceData = {
  capPercent: number | null;
  treasuryPercent: number | null;
  ratio: number | null;
};

function fractionPercent(f?: [number, number]): number | null {
  if (!f || f[1] <= 0) return null;
  return (f[0] / f[1]) * 100;
}

export function IssuancePanel() {
  const [data, setData] = useState<IssuanceData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [validators, config, stats] = await Promise.all([
          fetchValidators(),
          fetchProtocolConfig(),
          fetchNetworkStats(),
        ]);
        if (cancelled) return;
        setData({
          capPercent: fractionPercent(config.max_inflation_rate),
          treasuryPercent: fractionPercent(config.protocol_reward_rate),
          ratio: stats
            ? stakedRatioPercent(sumStakes(validators.current_validators), BigInt(stats.circulatingSupply))
            : null,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel
      title="~/issuance"
      ariaLabel="issuance"
      status={<Chip>read: rpc</Chip>}
      foot={
        <>
          <span>cap · live from protocol config</span>
          <span>target · from the proposal</span>
        </>
      }
    >
      {failed ? (
        <p className="font-mono text-xs text-error">issuance data unavailable right now.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-5 gap-y-4 max-[520px]:grid-cols-1 max-[520px]:gap-y-0">
            <div className="max-[520px]:pb-3.5">
              <StatRow
                accent
                label="protocol cap"
                value={
                  data?.capPercent !== null && data?.capPercent !== undefined
                    ? `${data.capPercent.toFixed(2)}%`
                    : "·"
                }
                hint="max_inflation_rate, read live from the chain config"
              />
            </div>
            <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
              <StatRow
                label="hsp-029 target"
                value={`${HSP029_TARGET_RATE.toFixed(2)}%`}
                hint="proposed target rate after a 24-month ramp"
              />
            </div>
            <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
              <StatRow
                label="staked ratio"
                value={data?.ratio !== null && data?.ratio !== undefined ? `${data.ratio.toFixed(1)}%` : "·"}
                hint="current staked share of circulating supply"
              />
            </div>
          </div>
          <p className="mt-4 max-w-[58ch] text-[13px] leading-[1.55] text-ink-70">
            hsp-029 at the house of stake proposes a 24-month issuance ramp
            to a 1.6% target rate of near token emissions. thecoding
            publicly supports the proposal: staking rewards are funded by
            issuance, and the numbers above are the live protocol values
            against the proposal&apos;s target.{" "}
            <a
              href={HSP029_URL}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-signal-ink underline decoration-ink-25 underline-offset-[3px] transition duration-[120ms] hover:decoration-signal-ink"
            >
              read the proposal →
            </a>
          </p>
        </>
      )}
    </Panel>
  );
}

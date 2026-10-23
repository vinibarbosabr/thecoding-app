import { useEffect, useState } from "react";
import { Panel } from "../ui/Panel";
import { Chip } from "../ui/Chip";
import { StatRow } from "../ui/StatRow";
import {
  fetchNetworkStats,
  fetchProtocolConfig,
  fetchValidators,
  totalShards,
} from "../../lib/networkRead";
import { stakedRatioPercent, sumStakes } from "../../lib/metrics";
import { formatNearCompact } from "../../lib/near";
import { EPOCH_HOURS_ESTIMATE, POOL_ID } from "../../config";

type NetworkData = {
  totalStaked: string;
  validatorCount: number;
  ratio: number | null;
  circulating: string | null;
  totalSupply: string | null;
  nodesOnline: number | null;
  nearPrice: number | null;
  epochLength: number | null;
  kickoutThreshold: number | null;
  blockProducerSeats: number | null;
  shards: number | null;
};

export function NetworkPanel() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [validators, stats, config] = await Promise.all([
          fetchValidators(),
          fetchNetworkStats(),
          fetchProtocolConfig().catch(() => null),
        ]);
        if (cancelled) return;
        const total = sumStakes(validators.current_validators);
        setData({
          totalStaked: total.toString(),
          validatorCount: validators.current_validators.length,
          ratio: stats ? stakedRatioPercent(total, BigInt(stats.circulatingSupply)) : null,
          circulating: stats?.circulatingSupply ?? null,
          totalSupply: stats?.totalSupply || null,
          nodesOnline: stats?.nodesOnline ?? null,
          nearPrice: stats?.nearPrice ?? null,
          epochLength: config?.epoch_length ?? null,
          kickoutThreshold: config?.block_producer_kickout_threshold ?? null,
          blockProducerSeats: config?.num_block_producer_seats ?? null,
          shards: config ? totalShards(config) : null,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <Panel
        title="~/network"
        ariaLabel="network"
        status={<Chip>read: rpc + nearblocks</Chip>}
      >
        <p className="font-mono text-xs text-error">network data unavailable right now.</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="~/network"
      ariaLabel="network"
      status={<Chip>read: rpc + nearblocks</Chip>}
      foot={
        <>
          <span>
            circulating ·{" "}
            {data?.circulating ? `${formatNearCompact(data.circulating)} Ⓝ` : "…"}
          </span>
          <span>
            total supply ·{" "}
            {data?.totalSupply ? `${formatNearCompact(data.totalSupply)} Ⓝ` : "…"}
          </span>
          {data?.nearPrice ? <span>near · ${data.nearPrice.toFixed(2)}</span> : null}
        </>
      }
    >
      {!data ? (
        <p className="font-mono text-xs text-ink-60">loading network stats…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-x-5 gap-y-4 max-[520px]:grid-cols-1 max-[520px]:gap-y-0">
            <div className="max-[520px]:pb-3.5">
              <StatRow
                accent
                label="staked · network"
                value={`${formatNearCompact(data.totalStaked)} Ⓝ`}
                hint="sum of every stake in the current epoch set"
              />
            </div>
            <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
              <StatRow
                label="staked ratio"
                value={data.ratio !== null ? `${data.ratio.toFixed(1)}%` : "·"}
                hint="staked share of circulating supply"
              />
            </div>
            <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
              <StatRow
                label="validators"
                value={data.validatorCount.toLocaleString("en-US")}
                hint={
                  data.nodesOnline !== null
                    ? `in the epoch set · ${data.nodesOnline} nodes online`
                    : "in the current epoch set"
                }
              />
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-ink-25 pt-3.5 font-mono text-xs leading-[1.8] text-ink-60">
            <p>
              epoch length ·{" "}
              {data.epochLength !== null
                ? `${data.epochLength.toLocaleString("en-US")} blocks · ~${EPOCH_HOURS_ESTIMATE}h`
                : "…"}
            </p>
            <p>
              kickout threshold ·{" "}
              {data.kickoutThreshold !== null ? `${data.kickoutThreshold}% online` : "…"}
              {data.blockProducerSeats !== null
                ? ` · ${data.blockProducerSeats} block producer seats`
                : ""}
            </p>
            <p>
              shards ·{" "}
              {data.shards !== null ? `${data.shards} (v3 layout)` : "…"}
              {` · validator ${POOL_ID}`}
            </p>
          </div>
        </>
      )}
    </Panel>
  );
}

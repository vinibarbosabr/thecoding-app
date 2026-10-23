import { useEffect, useState } from "react";
import { Panel } from "../ui/Panel";
import { Chip } from "../ui/Chip";
import { StatRow } from "../ui/StatRow";
import {
  fetchChainStatus,
  fetchProtocolConfig,
  fetchValidators,
} from "../../lib/networkRead";
import type { ValidatorEntry, ValidatorsResult } from "../../lib/networkRead";
import {
  epochProgressPercent,
  netFlowYocto,
  productivityPercent,
  toBig,
} from "../../lib/metrics";
import { formatNear, formatDeltaYocto } from "../../lib/near";
import { EPOCH_HOURS_ESTIMATE, POOL_ID } from "../../config";

type NodeData = {
  validators: ValidatorsResult;
  current: ValidatorEntry | null;
  nextStake: string | null;
  proposing: boolean;
  kickedOut: boolean;
  progress: number | null;
};

function DutyRow({ label, produced, expected }: { label: string; produced?: number; expected?: number }) {
  const pct = productivityPercent(produced ?? 0, expected ?? 0);
  const idle = (expected ?? 0) === 0;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 font-mono text-xs leading-[1.7]">
      <span className="text-ink-60">{label}</span>
      {idle ? (
        <span className="col-span-2 text-ink-40 tabular-nums">not assigned this epoch</span>
      ) : (
        <>
          <span className="text-right tabular-nums text-ink">
            {(produced ?? 0).toLocaleString("en-US")} / {(expected ?? 0).toLocaleString("en-US")}
          </span>
          <span className="w-[52px] text-right tabular-nums text-ink-60">
            {pct !== null ? `${pct.toFixed(2)}%` : "·"}
          </span>
        </>
      )}
    </div>
  );
}

export function NodePanel() {
  const [data, setData] = useState<NodeData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [validators, config, status] = await Promise.all([
          fetchValidators(),
          fetchProtocolConfig().catch(() => null),
          fetchChainStatus().catch(() => null),
        ]);
        if (cancelled) return;
        const current =
          validators.current_validators.find((v) => v.account_id === POOL_ID) ?? null;
        setData({
          validators,
          current,
          nextStake:
            validators.next_validators.find((v) => v.account_id === POOL_ID)?.stake ??
            null,
          proposing: validators.current_proposals.some((p) => p.account_id === POOL_ID),
          kickedOut: validators.prev_epoch_kickout.some(
            (k) => k.account_id === POOL_ID,
          ),
          progress:
            config && status
              ? epochProgressPercent(
                  status.latestBlockHeight,
                  validators.epoch_start_height,
                  config.epoch_length,
                )
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

  const stakeNow = data?.current?.stake ?? null;
  const reward = data ? toBig(data.validators.validator_reward_paid_prev_epoch?.[POOL_ID] ?? "0") : null;
  const delta =
    stakeNow && data?.nextStake && reward !== null
      ? toBig(data.nextStake) - toBig(stakeNow)
      : null;
  const flow =
    stakeNow && data?.nextStake && reward !== null
      ? netFlowYocto(toBig(stakeNow), toBig(data.nextStake), reward)
      : null;

  if (failed) {
    return (
      <Panel title="~/node" ariaLabel="node" status={<Chip>read: rpc</Chip>}>
        <p className="font-mono text-xs text-error">validator data unavailable right now.</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="~/node"
      ariaLabel="node"
      status={<Chip>read: rpc</Chip>}
      foot={
        <>
          <span>
            epoch {data ? data.validators.epoch_height : "…"}
            {data?.progress !== null && data?.progress !== undefined
              ? ` · ${Math.floor(data.progress)}% elapsed`
              : ""}
          </span>
          {data?.current?.public_key ? (
            <span>stake key · {data.current.public_key.slice(0, 14)}…</span>
          ) : null}
        </>
      }
    >
      {!data ? (
        <p className="font-mono text-xs text-ink-60">loading node stats…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant={data.current ? "solid" : "dashed"}>
              current · {data.current ? "validator" : "not in set"}
            </Chip>
            <Chip variant={data.nextStake ? "plain" : "dashed"}>
              next · {data.nextStake ? "validator" : data.proposing ? "proposing" : "not in set"}
            </Chip>
            {data.current?.is_slashed ? (
              <span className="font-mono text-[11px] text-error">slashed</span>
            ) : (
              <span className="font-mono text-[11px] text-ink-40">not slashed</span>
            )}
            {data.kickedOut ? (
              <span className="font-mono text-[11px] text-error">
                kicked out in the previous epoch
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-x-5 gap-y-4 max-[520px]:grid-cols-1 max-[520px]:gap-y-0">
            <div className="max-[520px]:pb-3.5">
              <StatRow
                accent
                label="stake"
                value={stakeNow ? formatNear(stakeNow) : "·"}
                unit="Ⓝ"
                hint="network stake held for this epoch"
              />
            </div>
            <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
              <StatRow
                label="next epoch"
                value={data.nextStake ? formatNear(data.nextStake) : "·"}
                unit="Ⓝ"
                hint={
                  delta !== null && flow !== null && reward !== null ? (
                    <>
                      {formatDeltaYocto(delta)} Ⓝ at rollover · reward{" "}
                      +{formatNear(reward.toString())} · net flow {formatDeltaYocto(flow)} Ⓝ
                    </>
                  ) : (
                    "stake for the epoch after rollover"
                  )
                }
              />
            </div>
            <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
              <StatRow
                label="reward"
                value={reward && reward > 0n ? formatNear(reward.toString()) : "·"}
                unit="Ⓝ"
                hint={`previous epoch · auto-compounded · ~${EPOCH_HOURS_ESTIMATE}h epochs`}
              />
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-ink-25 pt-3.5">
            <p className="font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
              epoch duties · running tally
            </p>
            <div className="mt-2.5">
              <DutyRow
                label="endorsements"
                produced={data.current?.num_produced_endorsements}
                expected={data.current?.num_expected_endorsements}
              />
              <DutyRow
                label="chunks"
                produced={data.current?.num_produced_chunks}
                expected={data.current?.num_expected_chunks}
              />
              <DutyRow
                label="blocks"
                produced={data.current?.num_produced_blocks}
                expected={data.current?.num_expected_blocks}
              />
            </div>
            <p className="mt-2.5 font-mono text-[10px] leading-[1.6] text-ink-40">
              {data.current?.shards_endorsed?.length
                ? `endorsing ${data.current.shards_endorsed.length} mandates across shards`
                : "no endorsement mandates assigned"}
              {" · "}
              {data.progress !== null
                ? `epoch ${Math.floor(data.progress)}% elapsed, counts are partial until rollover`
                : "counts are partial until rollover"}
            </p>
          </div>
        </>
      )}
    </Panel>
  );
}

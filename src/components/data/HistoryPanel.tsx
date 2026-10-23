import { useEffect, useState } from "react";
import { Panel } from "../ui/Panel";
import { Chip } from "../ui/Chip";
import { BarChart, LineChart, StackedFlowChart, ChartCaption } from "../ui/Chart";
import { fetchEpochHistory, epochNetApyPercent } from "../../lib/epochHistory";
import type { EpochRecord } from "../../lib/epochHistory";
import { fetchPoolStats } from "../../lib/networkRead";
import {
  delegationFlowYocto,
  stakeChangeYocto,
  toBig,
} from "../../lib/metrics";
import type { FeeFraction } from "../../lib/metrics";
import { formatNear, formatNearCompact, formatDeltaYocto } from "../../lib/near";

type Chartable = { label: string; record: EpochRecord }[];

/** yocto -> NEAR as a chart-scale number (float display precision). */
const nearNumber = (yocto: bigint): number => Number(yocto / 10n ** 20n) / 10_000;

export function HistoryPanel() {
  const [records, setRecords] = useState<EpochRecord[] | null>(null);
  const [recordingSince, setRecordingSince] = useState<number | null>(null);
  const [fee, setFee] = useState<FeeFraction | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [history, stats] = await Promise.all([
        fetchEpochHistory(),
        fetchPoolStats().catch(() => null),
      ]);
      if (cancelled) return;
      if (!history) {
        setFailed(true);
        return;
      }
      setRecords(history.epochs);
      setRecordingSince(history.recordingSinceEpoch);
      setFee(stats?.fee ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = records ?? [];
  const finalized: Chartable = list
    .filter((r) => r.reward !== null && r.stake !== null)
    .map((r) => ({ label: `epoch ${r.epoch}`, record: r }));
  const apyValues = finalized.map(({ record }) => epochNetApyPercent(record, fee));

  // reward-inclusive per-epoch stake change, splittable into reward +
  // delegation segments; needs this epoch's stake and the next one's
  const flowable: Chartable = list
    .filter((r) => r.stake !== null && r.nextStake !== null && r.reward !== null)
    .map((r) => ({ label: `epoch ${r.epoch}`, record: r }));
  const flowChange = flowable.map(({ record }) =>
    stakeChangeYocto(toBig(record.stake ?? "0"), toBig(record.nextStake ?? "0")),
  );
  const flowDelegation = flowable.map(({ record }, i) =>
    delegationFlowYocto(flowChange[i], toBig(record.reward ?? "0")),
  );
  const flowSum = flowChange.reduce((acc, v) => acc + v, 0n);
  const flowLargest = flowChange.reduce(
    (best, v) => (v > 0n && v > best ? v : best),
    0n,
  );

  const stakeRecords = list.filter((r) => r.stake !== null);
  const stakeValues = stakeRecords.map((r) => nearNumber(toBig(r.stake ?? "0")));
  const stakeLabels = stakeRecords.map((r) =>
    r.stake ? `${formatNearCompact(r.stake)} Ⓝ` : "·",
  );

  const recent = [...list].slice(-8).reverse();
  const epochLabel = (r: EpochRecord | undefined) =>
    r ? `epoch ${r.epoch.toLocaleString("en-US")}` : "·";

  return (
    <Panel
      title="~/epochs"
      ariaLabel="epoch history"
      status={<Chip>read: snapshots</Chip>}
      foot={
        <>
          <span>
            {recordingSince !== null
              ? `recording since epoch ${recordingSince.toLocaleString("en-US")}`
              : "…"}
          </span>
          <span>snapshots run hourly · github</span>
        </>
      }
    >
      {failed ? (
        <p className="font-mono text-xs text-ink-60">
          history unavailable right now (snapshot file missing or stale).
        </p>
      ) : !records ? (
        <p className="font-mono text-xs text-ink-60">loading epoch history…</p>
      ) : list.length === 0 ? (
        <p className="font-mono text-xs text-ink-60">
          no snapshots recorded yet; the first epochs appear after the
          snapshot workflow runs.
        </p>
      ) : (
        <>
          <p className="font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
            apy per epoch · net of fee
          </p>
          <BarChart
            values={apyValues.filter((v): v is number => v !== null)}
            ariaLabel="bar chart of net epoch apy per epoch"
            format={(v) => `${v.toFixed(2)}%`}
          />
          <ChartCaption
            left={finalized.length > 0 ? finalized[0].label : "·"}
            right={
              finalized.length > 0 ? finalized[finalized.length - 1].label : "·"
            }
          >
            <span>
              {apyValues.filter((v): v is number => v !== null).length} finalized
              epochs
            </span>
          </ChartCaption>

          <p className="mt-5 font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
            pool stake · all delegators
          </p>
          <LineChart
            values={stakeValues}
            labels={stakeLabels}
            ariaLabel="line chart of pool stake per epoch"
          />
          <ChartCaption
            left={epochLabel(stakeRecords[0])}
            right={epochLabel(stakeRecords[stakeRecords.length - 1])}
          >
            <span>{stakeRecords.length} sampled epochs</span>
          </ChartCaption>

          <p className="mt-5 font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
            stake change per epoch · reward + delegations stack
          </p>
          <StackedFlowChart
            rewards={flowable.map(({ record }) => nearNumber(toBig(record.reward ?? "0")))}
            delegations={flowDelegation.map(nearNumber)}
            ariaLabel="stacked bar chart of per-epoch stake change, reward and delegation segments"
            format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(2)} Ⓝ`}
          />
          <ChartCaption
            left={
              flowable.length > 0
                ? `Σ ${formatDeltaYocto(flowSum)} Ⓝ · ${
                    flowLargest > 0n ? `largest ${formatDeltaYocto(flowLargest)} Ⓝ` : "no growth yet"
                  }`
                : "·"
            }
            right={flowable.length > 0 ? flowable[flowable.length - 1].label : "·"}
          >
            <span>{flowable.length} chartable epochs</span>
          </ChartCaption>

          <div className="mt-5 overflow-x-auto border-t border-dashed border-ink-25 pt-3.5">
            <table className="w-full min-w-[440px] font-mono text-[11px] tabular-nums">
              <thead>
                <tr className="text-left font-normal text-ink-60">
                  <th className="py-1 pr-3">epoch</th>
                  <th className="py-1 pr-3">stake</th>
                  <th className="py-1 pr-3">reward</th>
                  <th className="py-1 pr-3">apy · net</th>
                  <th className="py-1 pr-3">change</th>
                  <th className="py-1">endorsements</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const apy = epochNetApyPercent(r, fee);
                  const change =
                    r.stake !== null && r.nextStake !== null
                      ? stakeChangeYocto(toBig(r.stake), toBig(r.nextStake))
                      : null;
                  const produced = r.endorsementsProduced;
                  const expected = r.endorsementsExpected;
                  return (
                    <tr key={r.epoch} className="border-t border-dashed border-ink-25">
                      <td className="py-1.5 pr-3 text-ink">
                        {r.epoch.toLocaleString("en-US")}
                        {r.final ? "" : " *"}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-70">
                        {r.stake ? formatNear(r.stake) : "·"}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-70">
                        {r.reward ? formatNear(r.reward) : "·"}
                      </td>
                      <td className="py-1.5 pr-3 text-signal-ink">
                        {apy !== null ? `~${apy.toFixed(2)}%` : "·"}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-70">
                        {change !== null ? formatDeltaYocto(change) : "·"}
                      </td>
                      <td className="py-1.5 text-ink-70">
                        {expected !== null && produced !== null
                          ? `${((produced / expected) * 100).toFixed(2)}%`
                          : "·"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 font-mono text-[10px] text-ink-40">
              * still in progress; reward and apy finalize after epoch rollover.
              change = reward + delegations, so it needs the next epoch's stake.
            </p>
          </div>
        </>
      )}
    </Panel>
  );
}

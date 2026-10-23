import { useEffect, useState } from "react";
import { Panel } from "../ui/Panel";
import { Chip } from "../ui/Chip";
import { BarChart, LineChart, ChartCaption } from "../ui/Chart";
import { fetchEpochHistory, epochNetApyPercent } from "../../lib/epochHistory";
import type { EpochRecord } from "../../lib/epochHistory";
import { fetchPoolStats } from "../../lib/networkRead";
import { netFlowYocto, toBig } from "../../lib/metrics";
import type { FeeFraction } from "../../lib/metrics";
import { formatNear, formatDeltaYocto } from "../../lib/near";

type Chartable = { label: string; record: EpochRecord }[];

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
  const stakeValues = list
    .filter((r) => r.stake !== null)
    .map((r) => Number(toBig(r.stake ?? 0n) / 10n ** 20n) / 10_000);
  const flowValues = finalized
    .filter(({ record }) => record.nextStake !== null && !record.bootstrap)
    .map(({ record }) => {
      const flow = netFlowYocto(
        toBig(record.stake ?? "0"),
        toBig(record.nextStake ?? "0"),
        toBig(record.reward ?? "0"),
      );
      return Number(flow / 10n ** 20n) / 10_000;
    });

  const recent = [...list].slice(-8).reverse();

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
            epoch apy · net of fee
          </p>
          <BarChart
            values={apyValues.filter((v): v is number => v !== null)}
            ariaLabel="bar chart of net epoch apy per epoch"
            format={(v) => `${v.toFixed(2)}%`}
          />
          <ChartCaption
            left={finalized.length > 0 ? finalized[0].label : "·"}
            right={finalized.length > 0 ? finalized[finalized.length - 1].label : "·"}
          >
            <span>
              {apyValues.filter((v): v is number => v !== null).length} finalized
              epochs
            </span>
          </ChartCaption>

          <p className="mt-5 font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
            pool stake · all delegators
          </p>
          <LineChart values={stakeValues} ariaLabel="line chart of pool stake per epoch" />
          <ChartCaption
            left={list.length > 0 ? `epoch ${list[0].epoch}` : "·"}
            right={list.length > 0 ? `epoch ${list[list.length - 1].epoch}` : "·"}
          >
            <span>{list.length} sampled epochs</span>
          </ChartCaption>

          <p className="mt-5 font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
            net stake flow · delegations minus withdrawals
          </p>
          <BarChart
            values={flowValues}
            ariaLabel="bar chart of net stake flow per epoch"
            format={(v) => `${v.toFixed(4)} Ⓝ`}
          />
          <ChartCaption
            left={
              flowValues.length > 0
                ? `min ${Math.min(...flowValues).toFixed(2)} Ⓝ`
                : "·"
            }
            right={
              flowValues.length > 0
                ? `max ${Math.max(...flowValues).toFixed(2)} Ⓝ`
                : "·"
            }
          />

          <div className="mt-5 overflow-x-auto border-t border-dashed border-ink-25 pt-3.5">
            <table className="w-full min-w-[440px] font-mono text-[11px] tabular-nums">
              <thead>
                <tr className="text-left font-normal text-ink-60">
                  <th className="py-1 pr-3">epoch</th>
                  <th className="py-1 pr-3">stake</th>
                  <th className="py-1 pr-3">reward</th>
                  <th className="py-1 pr-3">apy · net</th>
                  <th className="py-1 pr-3">flow</th>
                  <th className="py-1">endorsements</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const apy = epochNetApyPercent(r, fee);
                  const flow =
                    r.reward !== null && r.nextStake !== null && !r.bootstrap
                      ? netFlowYocto(toBig(r.stake ?? "0"), toBig(r.nextStake), toBig(r.reward))
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
                        {flow !== null ? formatDeltaYocto(flow) : "·"}
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
              bootstrap rows (derived stake) have no flow value.
            </p>
          </div>
        </>
      )}
    </Panel>
  );
}

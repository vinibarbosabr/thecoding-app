import type { FeeFraction } from "./metrics";
import { annualizedApyPercent, netApyPercent, toBig } from "./metrics";
import { EPOCH_HOURS_ESTIMATE } from "../config";

/**
 * Shape of public/data/epochs.json, written by
 * scripts/data-snapshot.mjs (build-time static data, ADR-04 §4).
 * Yocto values are strings; anything not yet observed is null.
 */

export type EpochRecord = {
  epoch: number;
  startHeight: number | null;
  final: boolean;
  bootstrap?: boolean;
  sampledAt: string;
  stake: string | null;
  nextStake: string | null;
  reward: string | null;
  endorsementsExpected: number | null;
  endorsementsProduced: number | null;
  blocksExpected: number | null;
  blocksProduced: number | null;
  chunksExpected: number | null;
  chunksProduced: number | null;
  networkTotalStaked: string | null;
  networkValidators: number | null;
  circulatingSupply: string | null;
};

export type EpochsFile = {
  recordingSinceEpoch: number | null;
  epochs: EpochRecord[];
};

export async function fetchEpochHistory(): Promise<EpochsFile | null> {
  try {
    const res = await fetch("data/epochs.json", { cache: "no-cache" });
    if (!res.ok) return null;
    const file = (await res.json()) as EpochsFile;
    if (!file || !Array.isArray(file.epochs)) return null;
    return file;
  } catch {
    return null;
  }
}

/**
 * Net apy percent for a finalized epoch, or null while pending.
 * History records hold the exact reward and the stake of that epoch,
 * so this is reward/stake annualized, net of the pool fee (no derived
 * base, unlike the live strip estimate).
 */
export function epochNetApyPercent(
  record: EpochRecord,
  fee: FeeFraction | null,
  epochHours: number = EPOCH_HOURS_ESTIMATE,
): number | null {
  if (!record.reward || !record.stake || !fee) return null;
  const gross = annualizedApyPercent(
    toBig(record.reward),
    toBig(record.stake),
    epochHours,
  );
  return gross === null ? null : netApyPercent(gross, fee);
}

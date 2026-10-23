import { EPOCH_HOURS_ESTIMATE } from "../config";

export type FeeFraction = { numerator: number; denominator: number };

export function toBig(value: string | bigint | number): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  return BigInt(value || "0");
}

/**
 * part / whole * 100, bigint-safe, or null when whole is zero.
 * Scaled to 1e15 so tiny per-epoch ratios keep ~12 significant
 * digits before the float conversion.
 */
export function ratioPercent(part: bigint, whole: bigint): number | null {
  if (whole <= 0n) return null;
  const scaled = (part * 1_000_000_000_000_000n) / whole;
  return Number(scaled) / 10_000_000_000_000;
}

export function epochsPerYear(epochHours: number = EPOCH_HOURS_ESTIMATE): number {
  return (365 * 24) / epochHours;
}

/**
 * The RPC reports the reward of the epoch that just ended while
 * get_total_staked_balance reports the present, so the base it was
 * earned on is derived: current total minus that reward.
 */
export function prevEpochStake(currentStake: bigint, reward: bigint): bigint {
  const base = currentStake - reward;
  return base > 0n ? base : 0n;
}

export function annualizedApyPercent(
  reward: bigint,
  baseStake: bigint,
  epochHours: number = EPOCH_HOURS_ESTIMATE,
): number | null {
  const perEpoch = ratioPercent(reward, baseStake);
  return perEpoch === null ? null : perEpoch * epochsPerYear(epochHours);
}

export function netApyPercent(grossPercent: number, fee: FeeFraction): number {
  const fraction =
    fee.denominator > 0 ? Math.min(Math.max(fee.numerator / fee.denominator, 0), 1) : 0;
  return grossPercent * (1 - fraction);
}

export function productivityPercent(produced: number, expected: number): number | null {
  if (expected <= 0) return null;
  return (produced / expected) * 100;
}

export function sumStakes(entries: { stake: string }[]): bigint {
  return entries.reduce((acc, e) => acc + toBig(e.stake), 0n);
}

export function stakedRatioPercent(staked: bigint, circulating: bigint): number | null {
  return ratioPercent(staked, circulating);
}

/**
 * Reward-inclusive per-epoch stake change: next epoch's stake minus
 * this epoch's stake, in yocto. Positive = the pool grew. The reward
 * (~17 Ⓝ today) accrues into every epoch's change: 1,000 Ⓝ staked on
 * a 17 Ⓝ reward reads +1017, a 34 Ⓝ unstake in another reads -17.
 */
export function stakeChangeYocto(stake: bigint, nextStake: bigint): bigint {
  return nextStake - stake;
}

/** Stake change minus the reward: the delegation-only flow (deposits
 * minus withdrawals) for the epoch. Positive = net stake inflow,
 * negative = net outflow. */
export function delegationFlowYocto(stakeChange: bigint, reward: bigint): bigint {
  return stakeChange - reward;
}

/**
 * How far the current epoch has advanced, 0..100, from the tip height
 * and the epoch's start height. Null when the inputs are inconsistent.
 */
export function epochProgressPercent(
  tipHeight: number,
  epochStartHeight: number,
  epochLength: number,
): number | null {
  if (epochLength <= 0 || tipHeight < epochStartHeight) return null;
  return Math.min(((tipHeight - epochStartHeight) / epochLength) * 100, 100);
}

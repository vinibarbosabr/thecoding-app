export type JourneyState = "s0" | "s1" | "s2" | "s3" | "s4";

// smallest balance formatNear renders nonzero (4 decimals = 0.0001
// near); below this the ui shows 0.0000 and the funds are dust.
export const MIN_VISIBLE_YOCTO = 10n ** 20n;

export function isVisible(yocto: string): boolean {
  try {
    return BigInt(yocto || "0") >= MIN_VISIBLE_YOCTO;
  } catch {
    return false;
  }
}

export type JourneyAvailability = {
  state: JourneyState;
  canUnstake: boolean;
  canMoveUnstaked: boolean;
};

export function deriveJourney(p: {
  connected: boolean;
  staked: string;
  unstaked: string;
  withdrawalAvailable: boolean;
}): JourneyAvailability {
  if (!p.connected) {
    return { state: "s0", canUnstake: false, canMoveUnstaked: false };
  }
  const stakedVisible = isVisible(p.staked);
  const unstakedVisible = isVisible(p.unstaked);
  const canUnstake = stakedVisible;
  const canMoveUnstaked = unstakedVisible && p.withdrawalAvailable;
  const state: JourneyState = unstakedVisible
    ? p.withdrawalAvailable
      ? "s4"
      : "s3"
    : stakedVisible
      ? "s2"
      : "s1";
  return { state, canUnstake, canMoveUnstaked };
}

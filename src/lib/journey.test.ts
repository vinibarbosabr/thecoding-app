import { describe, it, expect } from "vitest";
import { deriveJourney, isVisible } from "./journey";

describe("isVisible", () => {
  it("treats 0.0001 near (1e20 yocto) as the visibility floor", () => {
    expect(isVisible("100000000000000000000")).toBe(true);
  });

  it("treats one yocto below the floor as dust", () => {
    expect(isVisible("99999999999999999999")).toBe(false);
  });

  it("handles malformed or empty balances without throwing", () => {
    expect(isVisible("")).toBe(false);
    expect(isVisible("abc")).toBe(false);
  });
});

describe("deriveJourney", () => {
  const base = { staked: "0", unstaked: "0", withdrawalAvailable: false };

  it("s0 wins over everything when disconnected", () => {
    expect(
      deriveJourney({
        connected: false,
        staked: "5000000000000000000000000",
        unstaked: "1000000000000000000000000",
        withdrawalAvailable: true,
      }),
    ).toEqual({ state: "s0", canUnstake: false, canMoveUnstaked: false });
  });

  it("empty connected account is s1 with nothing available", () => {
    expect(deriveJourney({ ...base, connected: true })).toEqual({
      state: "s1",
      canUnstake: false,
      canMoveUnstaked: false,
    });
  });

  it("staked only is s2 and can unstake", () => {
    expect(
      deriveJourney({
        connected: true,
        staked: "5000000000000000000000000",
        unstaked: "0",
        withdrawalAvailable: false,
      }),
    ).toEqual({ state: "s2", canUnstake: true, canMoveUnstaked: false });
  });

  it("locked unstaked is s3", () => {
    expect(
      deriveJourney({
        connected: true,
        staked: "0",
        unstaked: "1000000000000000000000000",
        withdrawalAvailable: false,
      }),
    ).toEqual({ state: "s3", canUnstake: false, canMoveUnstaked: false });
  });

  it("mixed staked + withdrawable stays s4 but keeps unstake reachable", () => {
    expect(
      deriveJourney({
        connected: true,
        staked: "5000000000000000000000000",
        unstaked: "1000000000000000000000000",
        withdrawalAvailable: true,
      }),
    ).toEqual({ state: "s4", canUnstake: true, canMoveUnstaked: true });
  });

  it("dust withdrawable falls back to the staked journey (s2)", () => {
    expect(
      deriveJourney({
        connected: true,
        staked: "5000000000000000000000000",
        unstaked: "99999999999999999999",
        withdrawalAvailable: true,
      }),
    ).toEqual({ state: "s2", canUnstake: true, canMoveUnstaked: false });
  });

  it("dust staked does not enable unstake in s4", () => {
    expect(
      deriveJourney({
        connected: true,
        staked: "99999999999999999999",
        unstaked: "1000000000000000000000000",
        withdrawalAvailable: true,
      }),
    ).toEqual({ state: "s4", canUnstake: false, canMoveUnstaked: true });
  });
});

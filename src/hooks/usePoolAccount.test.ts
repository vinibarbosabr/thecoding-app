import { describe, it, expect } from "vitest";
import { maxStakeNear } from "./usePoolAccount";
import { LIQUID_BUFFER_NEAR } from "../config";

describe("maxStakeNear", () => {
  it("subtracts the 0.05 NEAR liquid reserve", () => {
    const liquid1Near = 1_000_000_000_000_000_000_000_000n;
    expect(maxStakeNear(liquid1Near)).toBeCloseTo(1 - LIQUID_BUFFER_NEAR, 5);
  });

  it("returns 0 when liquid below buffer", () => {
    expect(maxStakeNear(40_000_000_000_000_000_000_000n)).toBe(0);
  });

  it("returns 0 when nothing liquid", () => {
    expect(maxStakeNear(0n)).toBe(0);
  });

  it("keeps exactly the buffer when liquid equals buffer", () => {
    expect(maxStakeNear(50_000_000_000_000_000_000_000n)).toBe(0);
  });
});

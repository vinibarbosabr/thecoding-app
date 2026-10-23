import { describe, it, expect } from "vitest";
import {
  toBig,
  ratioPercent,
  epochsPerYear,
  prevEpochStake,
  annualizedApyPercent,
  netApyPercent,
  productivityPercent,
  sumStakes,
  stakedRatioPercent,
  netFlowYocto,
  epochProgressPercent,
} from "./metrics";
import { EPOCH_HOURS_ESTIMATE } from "../config";

// Live mainnet fixtures, epoch 4893 -> 4894 (verified 2026-10-23 via
// RPC `validators` and `get_total_staked_balance` on thecoding.pool.near):
// prev-epoch reward 17.238613113198740904295785 near on a base of
// 432,194.135880573642605442338758 near; fee 5/100; endorsements
// 20,114 of 20,192 expected.
const REWARD_4893 = 17238613113198740904295785n;
const STAKE_4894 = 432211374493686841346346634543n;
const STAKE_4895 = 432228986508563227967515485695n;

describe("toBig", () => {
  it("parses yocto strings", () => {
    expect(toBig("123")).toBe(123n);
  });

  it("tolerates empty and zero", () => {
    expect(toBig("")).toBe(0n);
    expect(toBig("0")).toBe(0n);
  });

  it("passes bigint through", () => {
    expect(toBig(5n)).toBe(5n);
  });
});

describe("ratioPercent", () => {
  it("computes a percent", () => {
    expect(ratioPercent(1n, 4n)).toBeCloseTo(25, 5);
  });

  it("returns null on zero whole", () => {
    expect(ratioPercent(1n, 0n)).toBeNull();
  });

  it("handles part larger than whole", () => {
    expect(ratioPercent(5n, 4n)).toBeCloseTo(125, 5);
  });
});

describe("epochsPerYear", () => {
  it("annualizes the 7.5h epoch estimate", () => {
    expect(epochsPerYear(EPOCH_HOURS_ESTIMATE)).toBe(1168);
  });
});

describe("prevEpochStake", () => {
  it("derives the base the reward was earned on", () => {
    expect(prevEpochStake(STAKE_4894, REWARD_4893)).toBe(
      432194135880573642605442338758n,
    );
  });

  it("floors to zero when the reward exceeds the stake", () => {
    expect(prevEpochStake(10n, 50n)).toBe(0n);
  });
});

describe("annualizedApyPercent", () => {
  it("annualizes the live epoch-4893 reward (gross)", () => {
    const base = prevEpochStake(STAKE_4894, REWARD_4893);
    expect(annualizedApyPercent(REWARD_4893, base)).toBeCloseTo(4.6587, 3);
  });

  it("returns null on an empty pool", () => {
    expect(annualizedApyPercent(REWARD_4893, 0n)).toBeNull();
  });
});

describe("netApyPercent", () => {
  it("applies the 5/100 pool fee to the live gross apy", () => {
    const net = netApyPercent(4.658716637881423, { numerator: 5, denominator: 100 });
    expect(net).toBeCloseTo(4.4258, 3);
  });

  it("clamps a malformed fee fraction to a no-fee floor", () => {
    expect(netApyPercent(10, { numerator: -1, denominator: 100 })).toBeCloseTo(10, 5);
    expect(netApyPercent(10, { numerator: 300, denominator: 100 })).toBeCloseTo(0, 5);
    expect(netApyPercent(10, { numerator: 1, denominator: 0 })).toBeCloseTo(10, 5);
  });
});

describe("productivityPercent", () => {
  it("computes the live epoch-4894 endorsement ratio", () => {
    expect(productivityPercent(20114, 20192)).toBeCloseTo(99.6137, 3);
  });

  it("returns null when nothing was expected yet", () => {
    expect(productivityPercent(0, 0)).toBeNull();
  });
});

describe("sumStakes", () => {
  it("sums validator stakes in yocto", () => {
    expect(sumStakes([{ stake: "100" }, { stake: "50" }])).toBe(150n);
  });

  it("tolerates an empty set", () => {
    expect(sumStakes([])).toBe(0n);
  });
});

describe("stakedRatioPercent", () => {
  it("computes the live staked-to-circulating ratio", () => {
    // exact rpc sums, epoch 4894: 397 current validators' stake vs
    // nearblocks circulating supply (both in yocto)
    const staked = 592863197124683768986714673190623n;
    const circulating = 1249836992159308065117756741322730n;
    expect(stakedRatioPercent(staked, circulating)).toBeCloseTo(47.435, 2);
  });

  it("returns null without circulating supply", () => {
    expect(stakedRatioPercent(10n ** 24n, 0n)).toBeNull();
  });
});

describe("netFlowYocto", () => {
  it("separates delegation flow from reward growth (live 4894 -> 4895)", () => {
    const flow = netFlowYocto(STAKE_4894, STAKE_4895, REWARD_4893);
    expect(flow).toBe(373401763187880264555367n);
  });

  it("goes negative on net withdrawals", () => {
    expect(netFlowYocto(100n, 80n, 5n)).toBe(-25n);
  });
});

describe("epochProgressPercent", () => {
  it("computes live progress from the tip (epoch 4894 heights)", () => {
    // tip 221,268,243 vs epoch start 221,241,134 over 43,200 blocks
    expect(epochProgressPercent(221_268_243, 221_241_134, 43_200)).toBeCloseTo(
      62.75,
      2,
    );
  });

  it("clamps past the epoch end", () => {
    // epoch 4894 started at height 221,241,134; +50k blocks is past its end
    expect(epochProgressPercent(221_291_134, 221_241_134, 43_200)).toBe(100);
  });

  it("returns null on inconsistent inputs", () => {
    expect(epochProgressPercent(100, 200, 43_200)).toBeNull();
    expect(epochProgressPercent(100, 50, 0)).toBeNull();
  });
});

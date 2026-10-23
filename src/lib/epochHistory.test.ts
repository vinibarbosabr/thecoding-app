import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchEpochHistory, epochNetApyPercent } from "./epochHistory";
import type { EpochRecord } from "./epochHistory";

// finalized epoch 4893 record from the live snapshot backfill
// (2026-10-23): exact reward on the exact stake of that epoch.
const RECORD_4893: EpochRecord = {
  epoch: 4893,
  startHeight: 221197934,
  final: true,
  sampledAt: "2026-10-23T00:00:00.000Z",
  stake: "432194135745249533782642338758",
  nextStake: "432211374493686841346346634543",
  reward: "17238613113198740904295785",
  endorsementsExpected: 43113,
  endorsementsProduced: 42309,
  blocksExpected: 0,
  blocksProduced: 0,
  chunksExpected: 0,
  chunksProduced: 0,
  networkTotalStaked: "592656706455447552932780270969145",
  networkValidators: 397,
  circulatingSupply: null,
};

describe("epochNetApyPercent", () => {
  it("annualizes the finalized epoch reward, net of the 5% fee", () => {
    const apy = epochNetApyPercent(RECORD_4893, { numerator: 5, denominator: 100 });
    // exact live math: reward 17.238613 on stake 432,194.135745
    expect(apy).toBeCloseTo(4.4258, 3);
  });

  it("returns null while the epoch is not finalized", () => {
    const pending: EpochRecord = { ...RECORD_4893, reward: null, final: false };
    expect(epochNetApyPercent(pending, { numerator: 5, denominator: 100 })).toBeNull();
  });

  it("returns null without a fee", () => {
    expect(epochNetApyPercent(RECORD_4893, null)).toBeNull();
  });

  it("returns null on an empty stake", () => {
    const empty: EpochRecord = { ...RECORD_4893, stake: "0" };
    expect(epochNetApyPercent(empty, { numerator: 5, denominator: 100 })).toBeNull();
  });
});

describe("fetchEpochHistory", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          recordingSinceEpoch: 4893,
          epochs: [RECORD_4893],
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the static snapshot file", async () => {
    const file = await fetchEpochHistory();
    expect(file?.recordingSinceEpoch).toBe(4893);
    expect(file?.epochs[0].epoch).toBe(4893);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("data/epochs.json");
  });

  it("resolves null on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 })),
    );
    expect(await fetchEpochHistory()).toBeNull();
  });

  it("resolves null on invalid shapes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ epochs: "nope" }) })),
    );
    expect(await fetchEpochHistory()).toBeNull();
  });

  it("resolves null on transport failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    expect(await fetchEpochHistory()).toBeNull();
  });
});

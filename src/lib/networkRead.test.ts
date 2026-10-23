import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchValidators,
  fetchProtocolConfig,
  fetchNetworkStats,
  fetchPoolStats,
  resetNetworkReadCache,
  totalShards,
} from "./networkRead";
import { RPC_URLS } from "../config";

const VALIDATORS_RESULT = {
  epoch_height: 4894,
  epoch_start_height: 221241134,
  current_validators: [
    {
      account_id: "thecoding.pool.near",
      stake: "432211374493686841346346634543",
      is_slashed: false,
      num_expected_endorsements: 35,
      num_produced_endorsements: 31,
    },
  ],
  next_validators: [
    { account_id: "thecoding.pool.near", stake: "432228986508563227967515485695" },
  ],
  current_proposals: [],
  prev_epoch_kickout: [],
  validator_reward_paid_prev_epoch: { "thecoding.pool.near": "17238613113198740904295785" },
};

function rpcJsonResponse(result: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ jsonrpc: "2.0", result }),
  };
}

describe("networkRead", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    resetNetworkReadCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetNetworkReadCache();
  });

  it("fetchValidators posts the latest reference and walks rpcs on failure", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("first down"))
      .mockResolvedValueOnce(rpcJsonResponse(VALIDATORS_RESULT));
    const out = await fetchValidators();
    expect(out.epoch_height).toBe(4894);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.method).toBe("validators");
    expect(body.params).toEqual({ latest: null });
    expect(fetchMock.mock.calls[0][0]).toBe(RPC_URLS[0]);
  });

  it("caches validators within the ttl so callers share one fetch", async () => {
    fetchMock.mockResolvedValue(rpcJsonResponse(VALIDATORS_RESULT));
    await fetchValidators();
    await fetchValidators();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the cache slot when the fetch rejects", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("down"))
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce(rpcJsonResponse(VALIDATORS_RESULT));
    await expect(fetchValidators()).rejects.toThrow("down");
    await fetchValidators();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("fetchProtocolConfig posts finality and parses issuance params", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcJsonResponse({
        epoch_length: 43200,
        max_inflation_rate: [1, 40],
        protocol_reward_rate: [0, 1],
        num_block_producer_seats: 100,
        block_producer_kickout_threshold: 80,
        chunk_producer_kickout_threshold: 80,
        shard_layout: { V3: { boundary_accounts: ["a", "b", "c"] } },
      }),
    );
    const config = await fetchProtocolConfig();
    expect(config.max_inflation_rate).toEqual([1, 40]);
    expect(totalShards(config)).toBe(4);
  });

  it("fetchNetworkStats parses nearblocks and nulls on http failure", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        stats: [
          {
            circulating_supply: "1249836992159308065117756741322730",
            total_supply: "1309745611452873301441114513312644",
            nodes_online: 412,
            near_price: "4.85000000",
          },
        ],
      }),
    });
    const stats = await fetchNetworkStats();
    expect(stats?.nodesOnline).toBe(412);
    expect(Number(stats?.circulatingSupply)).toBeGreaterThan(1e24);

    resetNetworkReadCache();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    expect(await fetchNetworkStats()).toBeNull();
  });

  it("fetchNetworkStats resolves null on transport failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await fetchNetworkStats()).toBeNull();
  });

  it("fetchPoolStats reuses the public view path for fee and total stake", async () => {
    const bytes = Array.from(new TextEncoder().encode(JSON.stringify({ numerator: 5, denominator: 100 })));
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jsonrpc: "2.0", result: { result: bytes } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          jsonrpc: "2.0",
          result: { result: Array.from(new TextEncoder().encode(JSON.stringify("432211374493686841346346634543"))) },
        }),
      });
    const stats = await fetchPoolStats();
    expect(stats.fee).toEqual({ numerator: 5, denominator: 100 });
    expect(stats.totalStaked).toBe("432211374493686841346346634543");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).params.method_name).toBe("get_reward_fee_fraction");
  });
});

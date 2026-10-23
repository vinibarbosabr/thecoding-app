import { RPC_URLS } from "../config";
import { getRewardFeeFraction, getTotalStakedBalance } from "./pool";
import { publicView } from "./poolRead";
import type { FeeFraction } from "./metrics";

/**
 * Read-only network data outside the pool contract. Same RPC origins
 * as poolRead (RPC_URLS, fallback walk), plus one public stats API
 * (NearBlocks, no key). Everything here is read-only; nothing signs.
 * Verified against mainnet on 2026-10-23 (ADR-04 §3).
 */

export type ValidatorEntry = {
  account_id: string;
  public_key?: string;
  stake: string;
  is_slashed?: boolean;
  num_expected_blocks?: number;
  num_produced_blocks?: number;
  num_expected_chunks?: number;
  num_produced_chunks?: number;
  num_expected_endorsements?: number;
  num_produced_endorsements?: number;
  num_expected_endorsements_per_shard?: number[];
  num_produced_endorsements_per_shard?: number[];
  shards?: number[];
  shards_endorsed?: number[];
};

export type NextValidatorEntry = {
  account_id: string;
  public_key: string;
  stake: string;
  shards: number[];
};

export type ProposalEntry = { account_id: string; public_key: string; stake: string };

export type ValidatorsResult = {
  epoch_height: number;
  epoch_start_height: number;
  current_validators: ValidatorEntry[];
  next_validators: NextValidatorEntry[];
  current_proposals: ProposalEntry[];
  prev_epoch_kickout: { account_id?: string; reason?: unknown }[];
  validator_reward_paid_prev_epoch: Record<string, string>;
};

export type ProtocolConfig = {
  epoch_length: number;
  max_inflation_rate: [number, number];
  protocol_reward_rate: [number, number];
  num_block_producer_seats: number;
  block_producer_kickout_threshold: number;
  chunk_producer_kickout_threshold: number;
  online_min_threshold?: [number, number];
  shard_layout?: { V3?: { boundary_accounts: string[] }; V1?: { num_shards: number } };
};

export type NetworkStats = {
  circulatingSupply: string;
  totalSupply: string;
  nodesOnline: number | null;
  nearPrice: number | null;
};

export type PoolStats = {
  fee: FeeFraction;
  totalStaked: string;
};

async function rpcJson<T>(method: string, params: unknown): Promise<T> {
  let lastError: unknown = null;
  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "thecoding-network-read", method, params }),
      });
      if (!res.ok) throw new Error(`rpc http ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error?.message ?? "rpc error");
      if (!json.result) throw new Error("empty rpc result");
      return json.result as T;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

type CacheCell<T> = { at: number; promise: Promise<T> };

const cache: {
  validators?: CacheCell<ValidatorsResult>;
  protocol?: CacheCell<ProtocolConfig>;
  stats?: CacheCell<NetworkStats | null>;
  pool?: CacheCell<PoolStats>;
} = {};

export function resetNetworkReadCache(): void {
  cache.validators = undefined;
  cache.protocol = undefined;
  cache.stats = undefined;
  cache.pool = undefined;
}

function cached<T>(cell: keyof typeof cache, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache[cell] as CacheCell<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise;
  const promise = load();
  const entry: CacheCell<T> = { at: Date.now(), promise };
  (cache as Record<string, CacheCell<T> | undefined>)[cell] = entry;
  // a rejected promise should not poison the cache slot
  void promise.catch(() => {
    if ((cache[cell] as CacheCell<T> | undefined) === entry) {
      (cache as Record<string, CacheCell<T> | undefined>)[cell] = undefined;
    }
  });
  return promise;
}

/**
 * Full validator set for the current epoch (~300 KB; module-cached for
 * 60s so the pool strip and the data view share one fetch).
 */
export function fetchValidators(): Promise<ValidatorsResult> {
  return cached("validators", 60_000, () =>
    rpcJson<ValidatorsResult>("validators", { latest: null }),
  );
}

/** Live protocol parameters (change rarely; cached 1h). */
export function fetchProtocolConfig(): Promise<ProtocolConfig> {
  return cached("protocol", 3_600_000, () =>
    rpcJson<ProtocolConfig>("EXPERIMENTAL_protocol_config", { finality: "final" }),
  );
}

/**
 * Public NearBlocks stats: supply, nodes online, price. No key. Any
 * failure resolves to null (never throws) so panels can degrade quietly.
 */
export function fetchNetworkStats(): Promise<NetworkStats | null> {
  return cached("stats", 600_000, async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        const res = await fetch("https://api.nearblocks.io/v1/stats", {
          signal: controller.signal,
        });
        if (!res.ok) return null;
        const json = await res.json();
        const s = json?.stats?.[0];
        if (!s || typeof s.circulating_supply !== "string") return null;
        const price = Number(s.near_price);
        return {
          circulatingSupply: s.circulating_supply,
          totalSupply: typeof s.total_supply === "string" ? s.total_supply : "",
          nodesOnline: typeof s.nodes_online === "number" ? s.nodes_online : null,
          nearPrice: Number.isFinite(price) ? price : null,
        } satisfies NetworkStats;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return null;
    }
  });
}

/** Pool contract stats via the existing public view path (cached 60s). */
export function fetchPoolStats(): Promise<PoolStats> {
  return cached("pool", 60_000, async () => {
    const [fee, totalStaked] = await Promise.all([
      getRewardFeeFraction(publicView),
      getTotalStakedBalance(publicView),
    ]);
    return { fee, totalStaked };
  });
}

export function totalShards(config: ProtocolConfig): number | null {
  const v3 = config.shard_layout?.V3;
  if (v3?.boundary_accounts) return v3.boundary_accounts.length + 1;
  const v1 = config.shard_layout?.V1;
  if (typeof v1?.num_shards === "number") return v1.num_shards;
  return null;
}

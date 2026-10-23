#!/usr/bin/env node
/**
 * data-snapshot.mjs — appends/updates one record per epoch in
 * public/data/epochs.json (ADR-04 §4).
 *
 * Zero dependencies (node >= 18). Read-only: RPC `validators` +
 * `EXPERIMENTAL_protocol_config`, plus NearBlocks' public stats. Runs
 * hourly in CI (GitHub Action) and locally:
 * `node scripts/data-snapshot.mjs [--backfill N]`.
 *
 * Record semantics:
 * - `reward` is the reward paid FOR that epoch. It becomes visible in
 *   the first run of the next epoch (`validator_reward_paid_prev_epoch`),
 *   so a record finalizes on rollover.
 * - during epoch N the record for N refreshes its live duty tally
 *   (endorsements, chunks, blocks) each run;
 * - on rollover, epoch N-1 gets its exact reward plus, best effort,
 *   the final duty tally read at the last block of that epoch
 *   (public rpcs decline historical validator info sometimes; the
 *   last in-epoch sample remains then).
 * - `--backfill N` reconstructs up to N past epochs from historical
 *   validator info at epoch boundaries, walking by the protocol
 *   epoch length. One boundary query yields epoch k's final tally and
 *   stake, and epoch k-1's reward.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = resolve(ROOT, "public/data/epochs.json");

// parse src/config.ts so the script never drifts from the app's
// rpc endpoints or pool id
const configSource = await readFile(resolve(ROOT, "src/config.ts"), "utf8");
const POOL_ID = configSource.match(/export const POOL_ID = "([^"]+)"/)?.[1];
const RPC_URLS = (configSource
  .match(/export const RPC_URLS = \[([^\]]+)\]/)?.[1]
  .match(/"(https:\/\/[^"]+)"/g) ?? []
).map((s) => s.replace(/"/g, ""));

if (!POOL_ID || RPC_URLS.length === 0) {
  console.error("could not parse POOL_ID/RPC_URLS from src/config.ts");
  process.exit(1);
}

const NEARBLOCKS_STATS = "https://api.nearblocks.io/v1/stats";
const MAX_RECORDS = 730; // ~9 months of 7.5h epochs

async function rpc(method, params) {
  let lastError;
  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "thecoding-snapshot", method, params }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error?.message ?? "rpc error");
      if (!json.result) throw new Error("empty result");
      return json.result;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function nearblocks() {
  try {
    const res = await fetch(NEARBLOCKS_STATS, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const s = (await res.json())?.stats?.[0];
    return typeof s?.circulating_supply === "string" ? s : null;
  } catch {
    return null;
  }
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function poolEntry(validators) {
  return validators.current_validators.find((v) => v.account_id === POOL_ID) ?? null;
}

function snapshotRecord(validators, circulating) {
  const current = poolEntry(validators);
  return {
    epoch: validators.epoch_height,
    startHeight: validators.epoch_start_height ?? null,
    final: false,
    sampledAt: new Date().toISOString(),
    stake: current?.stake ?? null,
    nextStake:
      validators.next_validators.find((v) => v.account_id === POOL_ID)?.stake ?? null,
    reward: null,
    endorsementsExpected: num(current?.num_expected_endorsements),
    endorsementsProduced: num(current?.num_produced_endorsements),
    blocksExpected: num(current?.num_expected_blocks),
    blocksProduced: num(current?.num_produced_blocks),
    chunksExpected: num(current?.num_expected_chunks),
    chunksProduced: num(current?.num_produced_chunks),
    networkTotalStaked: validators.current_validators.reduce(
      (a, v) => a + BigInt(v.stake),
      0n,
    ).toString(),
    networkValidators: validators.current_validators.length,
    circulatingSupply: typeof circulating === "string" ? circulating : null,
  };
}

/** Final duty tally read at the last block of a past epoch. */
async function boundarySnapshot(blockHeight, expectEpoch) {
  try {
    const past = await rpc("validators", { block_id: blockHeight });
    if (past.epoch_height !== expectEpoch || !poolEntry(past)) return null;
    const rec = snapshotRecord(past, null);
    rec.epoch = expectEpoch;
    // the boundary carries the reward paid for the epoch before it
    rec.prevReward = past.validator_reward_paid_prev_epoch?.[POOL_ID] ?? null;
    return rec;
  } catch {
    return null;
  }
}

function cleanRecord(r) {
  const { prevReward, ...out } = r;
  if (out.bootstrap === undefined) delete out.bootstrap;
  return out;
}

function upsert(db, record) {
  db.epochs = db.epochs.filter((e) => e.epoch !== record.epoch);
  db.epochs.push(record);
}

async function load() {
  try {
    const parsed = JSON.parse(await readFile(FILE, "utf8"));
    if (parsed && Array.isArray(parsed.epochs)) return parsed;
  } catch {
    /* first run */
  }
  return { recordingSinceEpoch: null, epochs: [] };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const backfill = Math.max(
    0,
    Number(process.argv.find((a) => a.startsWith("--backfill="))?.slice(11) || 0),
  );

  const [live, config, nb] = await Promise.all([
    rpc("validators", { latest: null }),
    rpc("EXPERIMENTAL_protocol_config", { finality: "final" }),
    nearblocks(),
  ]);
  const epochLength = config.epoch_length;
  const epoch = live.epoch_height;
  const livePrevReward = live.validator_reward_paid_prev_epoch?.[POOL_ID] ?? null;

  const db = await load();

  // --backfill N: rebuild past epochs from boundary snapshots
  if (backfill > 0) {
    const boundaries = new Map();
    for (let k = epoch - backfill; k <= epoch - 1; k++) {
      // last block of epoch k = start(k+1) - 1
      const startOfNext = live.epoch_start_height - (epoch - k - 1) * epochLength;
      const rec = await boundarySnapshot(startOfNext - 1, k);
      if (rec) boundaries.set(k, rec);
      await sleep(300);
    }
    for (const [k, rec] of boundaries) {
      rec.reward =
        k === epoch - 1 ? livePrevReward : (boundaries.get(k + 1)?.prevReward ?? null);
      rec.final = rec.reward !== null;
      upsert(db, cleanRecord(rec));
    }
    console.log(`backfill: ${boundaries.size}/${backfill} boundaries recovered`);
  }

  // bootstrap: first run ever still records the previous epoch from
  // the live response (derived stake, exact reward)
  if (db.epochs.length === 0 && livePrevReward && poolEntry(live)) {
    const current = poolEntry(live);
    db.recordingSinceEpoch = epoch - 1;
    upsert(db, {
      epoch: epoch - 1,
      startHeight: null,
      final: true,
      bootstrap: true,
      sampledAt: new Date().toISOString(),
      stake: (BigInt(current.stake) - BigInt(livePrevReward)).toString(),
      nextStake: current.stake,
      reward: livePrevReward,
      endorsementsExpected: null,
      endorsementsProduced: null,
      blocksExpected: null,
      blocksProduced: null,
      chunksExpected: null,
      chunksProduced: null,
      networkTotalStaked: null,
      networkValidators: null,
      circulatingSupply: null,
    });
  }

  // finalize the previous epoch: exact reward + final tally
  const prev = db.epochs.find((e) => e.epoch === epoch - 1);
  if (prev && !prev.final) {
    const tally = await boundarySnapshot(live.epoch_start_height - 1, epoch - 1);
    if (tally) {
      prev.endorsementsExpected = tally.endorsementsExpected;
      prev.endorsementsProduced = tally.endorsementsProduced;
      prev.blocksExpected = tally.blocksExpected;
      prev.blocksProduced = tally.blocksProduced;
      prev.chunksExpected = tally.chunksExpected;
      prev.chunksProduced = tally.chunksProduced;
      prev.stake = tally.stake; // exact stake beats the derived bootstrap value
      prev.nextStake = prev.nextStake ?? tally.nextStake;
      prev.networkTotalStaked = prev.networkTotalStaked ?? tally.networkTotalStaked;
      prev.networkValidators = prev.networkValidators ?? tally.networkValidators;
      delete prev.bootstrap; // stake is now exact, flow becomes computable
    }
    prev.reward = livePrevReward ?? prev.reward ?? null;
    prev.final = prev.reward !== null;
  }

  // refresh the live epoch record (reward for it is not yet known)
  const existing = db.epochs.find((e) => e.epoch === epoch);
  const liveRecord = snapshotRecord(live, nb?.circulating_supply ?? null);
  liveRecord.reward = existing?.reward ?? null;
  if (existing?.stake && !liveRecord.stake) liveRecord.stake = existing.stake;
  upsert(db, cleanRecord(liveRecord));

  db.recordingSinceEpoch = db.recordingSinceEpoch ?? db.epochs[0]?.epoch ?? epoch;
  db.epochs.sort((a, b) => a.epoch - b.epoch);
  if (db.epochs.length > MAX_RECORDS) db.epochs = db.epochs.slice(-MAX_RECORDS);

  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(db, null, 2) + "\n");

  const finalizedCount = db.epochs.filter((e) => e.final).length;
  console.log(
    `snapshot ok · epoch ${epoch} · ${db.epochs.length} records (${finalizedCount} finalized)`,
  );
}

main().catch((e) => {
  console.error(`snapshot failed: ${e?.message ?? e}`);
  process.exit(1);
});

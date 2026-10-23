export const POOL_ID = "thecoding.pool.near";

export const NETWORK = "mainnet" as const;

export const RPC_URLS = [
  "https://free.rpc.fastnear.com",
  "https://rpc.mainnet.near.org",
];

export const GAS_50_TGAS = "50000000000000";

export const LIQUID_BUFFER_NEAR = 0.05;

export const YOCTO_PER_NEAR = 1_000_000_000_000_000_000_000_000n;

export const EPOCH_HOURS_ESTIMATE = 7.5;

export const UNBONDING_EPOCHS = 4;

export const NEARBLOCKS_TX_BASE = "https://nearblocks.io/txns/";

// hsp-029 (house of stake): 24-month issuance ramp to a 1.6% target
// rate of near token emissions. publicly supported by thecoding.
export const HSP029_URL = "https://gov.houseofstake.org/proposals/29";
export const HSP029_TARGET_RATE = 1.6;

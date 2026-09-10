import { GAS_50_TGAS, POOL_ID } from "../config";
import type { Action } from "near-connect-hooks";

export const RECEIVER = POOL_ID;

export function stakeBuilder(amountYocto: string): Action[] {
  return [
    {
      type: "FunctionCall",
      params: {
        methodName: "deposit_and_stake",
        args: {},
        gas: GAS_50_TGAS,
        deposit: amountYocto,
      },
    },
  ];
}

export function restakeBuilder(amountYocto: string): Action[] {
  return [
    {
      type: "FunctionCall",
      params: {
        methodName: "stake",
        args: { amount: amountYocto },
        gas: GAS_50_TGAS,
        deposit: "0",
      },
    },
  ];
}

export function unstakeBuilder(amountYocto: string): Action[] {
  return [
    {
      type: "FunctionCall",
      params: {
        methodName: "unstake",
        args: { amount: amountYocto },
        gas: GAS_50_TGAS,
        deposit: "0",
      },
    },
  ];
}

export function unstakeAllBuilder(): Action[] {
  return [
    {
      type: "FunctionCall",
      params: {
        methodName: "unstake_all",
        args: {},
        gas: GAS_50_TGAS,
        deposit: "0",
      },
    },
  ];
}

export function withdrawBuilder(amountYocto: string): Action[] {
  return [
    {
      type: "FunctionCall",
      params: {
        methodName: "withdraw",
        args: { amount: amountYocto },
        gas: GAS_50_TGAS,
        deposit: "0",
      },
    },
  ];
}

export function withdrawAllBuilder(): Action[] {
  return [
    {
      type: "FunctionCall",
      params: {
        methodName: "withdraw_all",
        args: {},
        gas: GAS_50_TGAS,
        deposit: "0",
      },
    },
  ];
}

export type PoolAccount = {
  staked_balance: string;
  unstaked_balance: string;
  withdrawal_available: boolean;
};

export async function getAccount(
  view: (p: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>,
  accountId: string,
): Promise<PoolAccount> {
  const res = await view({
    contractId: POOL_ID,
    method: "get_account",
    args: { account_id: accountId },
  });
  return {
    staked_balance: res.staked_balance ?? "0",
    unstaked_balance: res.unstaked_balance ?? "0",
    withdrawal_available:
      res.unstaked_balance && res.unstaked_balance !== "0"
        ? await isAccountUnstakedBalanceAvailable(view, accountId)
        : false,
  };
}

export async function isAccountUnstakedBalanceAvailable(
  view: (p: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>,
  accountId: string,
): Promise<boolean> {
  return Boolean(
    await view({
      contractId: POOL_ID,
      method: "is_account_unstaked_balance_available",
      args: { account_id: accountId },
    }),
  );
}

export async function getRewardFeeFraction(
  view: (p: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>,
): Promise<{ numerator: number; denominator: number }> {
  return await view({
    contractId: POOL_ID,
    method: "get_reward_fee_fraction",
    args: {},
  });
}

export async function getTotalStakedBalance(
  view: (p: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>,
): Promise<string> {
  return await view({
    contractId: POOL_ID,
    method: "get_total_staked_balance",
    args: {},
  });
}

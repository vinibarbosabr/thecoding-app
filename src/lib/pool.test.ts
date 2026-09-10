import { describe, it, expect } from "vitest";
import { GAS_50_TGAS, POOL_ID } from "../config";
import {
  stakeBuilder,
  restakeBuilder,
  unstakeBuilder,
  unstakeAllBuilder,
  withdrawBuilder,
  withdrawAllBuilder,
  RECEIVER,
} from "./pool";

const ONE_YOCTO = "1000000000000000000000000";

type FunctionCallAction = Extract<
  ReturnType<typeof stakeBuilder>[number],
  { type: "FunctionCall" }
>;

function fc(action: ReturnType<typeof stakeBuilder>[number]) {
  return (action as FunctionCallAction).params;
}

describe("pool builders — receiver and gas", () => {
  it("RECEIVER is the pool contract", () => {
    expect(RECEIVER).toBe(POOL_ID);
    expect(RECEIVER).toBe("thecoding.pool.near");
  });

  it("all builders use 50 TGas", () => {
    const all = [
      ...stakeBuilder(ONE_YOCTO),
      ...restakeBuilder(ONE_YOCTO),
      ...unstakeBuilder(ONE_YOCTO),
      ...unstakeAllBuilder(),
      ...withdrawBuilder(ONE_YOCTO),
      ...withdrawAllBuilder(),
    ];
    for (const a of all) {
      expect(a.type).toBe("FunctionCall");
      expect(fc(a).gas).toBe(GAS_50_TGAS);
    }
  });
});

describe("stake (deposit_and_stake)", () => {
  it("method, deposit = amount, empty args", () => {
    const a = fc(stakeBuilder(ONE_YOCTO)[0]);
    expect(a.methodName).toBe("deposit_and_stake");
    expect(a.deposit).toBe(ONE_YOCTO);
    expect(a.args).toEqual({});
  });
});

describe("restake (stake, no deposit)", () => {
  it("method stake, deposit 0, amount in args", () => {
    const a = fc(restakeBuilder(ONE_YOCTO)[0]);
    expect(a.methodName).toBe("stake");
    expect(a.deposit).toBe("0");
    expect(a.args).toEqual({ amount: ONE_YOCTO });
  });
});

describe("unstake", () => {
  it("method unstake, no deposit, amount in args", () => {
    const a = fc(unstakeBuilder(ONE_YOCTO)[0]);
    expect(a.methodName).toBe("unstake");
    expect(a.deposit).toBe("0");
    expect(a.args).toEqual({ amount: ONE_YOCTO });
  });
});

describe("unstake_all", () => {
  it("method unstake_all, no deposit, empty args", () => {
    const a = fc(unstakeAllBuilder()[0]);
    expect(a.methodName).toBe("unstake_all");
    expect(a.deposit).toBe("0");
    expect(a.args).toEqual({});
  });
});

describe("withdraw", () => {
  it("method withdraw, no deposit, amount in args", () => {
    const a = fc(withdrawBuilder(ONE_YOCTO)[0]);
    expect(a.methodName).toBe("withdraw");
    expect(a.deposit).toBe("0");
    expect(a.args).toEqual({ amount: ONE_YOCTO });
  });
});

describe("withdraw_all", () => {
  it("method withdraw_all, no deposit, empty args", () => {
    const a = fc(withdrawAllBuilder()[0]);
    expect(a.methodName).toBe("withdraw_all");
    expect(a.deposit).toBe("0");
    expect(a.args).toEqual({});
  });
});

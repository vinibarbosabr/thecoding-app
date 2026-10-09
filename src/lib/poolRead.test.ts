import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { publicView } from "./poolRead";

function rpcResponse(resultObject: unknown) {
  const bytes = Array.from(new TextEncoder().encode(JSON.stringify(resultObject)));
  return {
    ok: true,
    status: 200,
    json: async () => ({ jsonrpc: "2.0", result: { result: bytes } }),
  };
}

describe("publicView", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes a get_account-shaped view result", async () => {
    fetchMock.mockResolvedValueOnce(
      rpcResponse({
        staked_balance: "1000000000000000000000000",
        unstaked_balance: "500000000000000000000000",
        unread: false,
      }),
    );
    const out = await publicView({
      contractId: "thecoding.pool.near",
      method: "get_account",
      args: { account_id: "vini.near" },
    });
    expect(out).toEqual({
      staked_balance: "1000000000000000000000000",
      unstaked_balance: "500000000000000000000000",
      unread: false,
    });
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.params.request_type).toBe("call_function");
    expect(body.params.account_id).toBe("thecoding.pool.near");
    expect(body.params.method_name).toBe("get_account");
    expect(atob(body.params.args_base64)).toBe('{"account_id":"vini.near"}');
  });

  it("throws panic errors without retrying the fallback rpc", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: "2.0",
        result: { error: "Smart contract panicked: Account is not registered" },
      }),
    });
    await expect(
      publicView({ contractId: "thecoding.pool.near", method: "get_account", args: {} }),
    ).rejects.toThrow(/panicked/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the second rpc on transport failure", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(rpcResponse({ ok: 1 }));
    const out = await publicView({
      contractId: "thecoding.pool.near",
      method: "get_total_staked_balance",
      args: {},
    });
    expect(out).toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces the last error after every rpc fails", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("first down"))
      .mockRejectedValueOnce(new Error("second down"));
    await expect(
      publicView({ contractId: "thecoding.pool.near", method: "get_account", args: {} }),
    ).rejects.toThrow("second down");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

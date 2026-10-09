import { POOL_ID, RPC_URLS } from "../config";
import {
  getAccount,
  getRewardFeeFraction,
  getTotalStakedBalance,
} from "./pool";

export type ViewFn = (p: {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
}) => Promise<any>;

async function rpcCall(
  url: string,
  method: string,
  argsBase64: string,
): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "thecoding-pool-read",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: POOL_ID,
        method_name: method,
        args_base64: argsBase64,
      },
    }),
  });
  if (!res.ok) throw new Error(`rpc http ${res.status}`);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error?.message ?? "rpc error");
  }
  const panic = json?.result?.error;
  if (panic) {
    throw new Error(String(panic));
  }
  const raw = json?.result?.result;
  if (!raw) throw new Error("empty rpc result");
  const text = new TextDecoder().decode(Uint8Array.from(raw));
  return JSON.parse(text);
}

export const publicView: ViewFn = async ({ method, args = {} }) => {
  const argsBase64 = btoa(JSON.stringify(args));
  let lastError: unknown = null;
  for (const url of RPC_URLS) {
    try {
      return await rpcCall(url, method, argsBase64);
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("panicked")) throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

export async function readPoolAccountPublic(accountId: string) {
  return getAccount(publicView, accountId);
}

export async function readPoolStatsPublic() {
  const [fee, totalStaked] = await Promise.all([
    getRewardFeeFraction(publicView),
    getTotalStakedBalance(publicView),
  ]);
  return { fee, totalStaked };
}

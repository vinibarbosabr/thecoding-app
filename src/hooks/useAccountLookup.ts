import { useCallback, useState } from "react";
import { getAccount } from "../lib/pool";
import type { PoolAccount } from "../lib/pool";
import { publicView } from "../lib/poolRead";

export type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; accountId: string; account: PoolAccount };

export const LOOKUP_ERROR =
  "error: account not found; check the id and try again.";

export function useAccountLookup() {
  const [state, setState] = useState<LookupState>({ status: "idle" });

  const lookup = useCallback(async (accountId: string) => {
    setState({ status: "loading" });
    try {
      const account = await getAccount(publicView, accountId);
      setState({ status: "done", accountId, account });
    } catch {
      setState({ status: "error", message: LOOKUP_ERROR });
    }
  }, []);

  return { state, lookup };
}

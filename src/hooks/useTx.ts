import { useCallback, useState } from "react";
import { useNearWallet } from "near-connect-hooks";
import type { Action } from "near-connect-hooks";
import { RECEIVER } from "../lib/pool";

type TxOutcome = { transaction?: { hash?: string }; transaction_outcome?: { id?: string } };

export type TxState = {
  pending: boolean;
  lastTxHash: string | null;
  error: string | null;
  sign: (actions: Action[]) => Promise<TxOutcome | null>;
};

export function useTx(refetch: () => void): TxState {
  const wallet = useNearWallet();
  const [pending, setPending] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sign = useCallback(
    async (actions: Action[]): Promise<TxOutcome | null> => {
      setPending(true);
      setError(null);
      try {
        const outcome = (await wallet.signAndSendTransaction({
          receiverId: RECEIVER,
          actions,
        })) as unknown as TxOutcome;
        const hash = outcome?.transaction?.hash ?? outcome?.transaction_outcome?.id ?? null;
        if (hash) setLastTxHash(hash);
        refetch();
        return outcome;
      } catch (e: any) {
        setError(e?.message ?? String(e));
        return null;
      } finally {
        setPending(false);
      }
    },
    [wallet, refetch],
  );

  return { pending, lastTxHash, error, sign };
}

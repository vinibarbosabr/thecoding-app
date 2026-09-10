import { useCallback, useEffect, useState } from "react";
import { useNearWallet } from "near-connect-hooks";
import { getAccount, getRewardFeeFraction, getTotalStakedBalance } from "../lib/pool";
import { LIQUID_BUFFER_NEAR } from "../config";

export type PoolPosition = {
  staked: string;
  unstaked: string;
  withdrawalAvailable: boolean;
  liquid: bigint;
  fee: { numerator: number; denominator: number } | null;
  totalStaked: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function usePoolAccount(): PoolPosition {
  const wallet = useNearWallet();
  const accountId = wallet.signedAccountId;
  const [staked, setStaked] = useState("0");
  const [unstaked, setUnstaked] = useState("0");
  const [withdrawalAvailable, setWithdrawalAvailable] = useState(false);
  const [liquid, setLiquid] = useState(0n);
  const [fee, setFee] = useState<{ numerator: number; denominator: number } | null>(null);
  const [totalStaked, setTotalStaked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!accountId) {
      setStaked("0");
      setUnstaked("0");
      setWithdrawalAvailable(false);
      setLiquid(0n);
      setFee(null);
      setTotalStaked(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [account, liquidBalance, feeFraction, total] = await Promise.all([
          getAccount(wallet.viewFunction, accountId),
          wallet.getBalance(accountId),
          getRewardFeeFraction(wallet.viewFunction),
          getTotalStakedBalance(wallet.viewFunction),
        ]);
        if (cancelled) return;
        setStaked(account.staked_balance);
        setUnstaked(account.unstaked_balance);
        setWithdrawalAvailable(account.withdrawal_available);
        setLiquid(liquidBalance);
        setFee(feeFraction);
        setTotalStaked(total);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId, nonce, wallet]);

  return {
    staked,
    unstaked,
    withdrawalAvailable,
    liquid,
    fee,
    totalStaked,
    loading,
    error,
    refetch,
  };
}

export function maxStakeNear(liquid: bigint): number {
  const liquidNear = Number(liquid) / 1e24;
  const max = liquidNear - LIQUID_BUFFER_NEAR;
  return max > 0 ? max : 0;
}

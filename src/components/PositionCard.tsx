import { formatNear } from "../lib/near";
import type { PoolPosition } from "../hooks/usePoolAccount";

export function PositionCard({
  position,
  connected,
}: {
  position: PoolPosition;
  connected: boolean;
}) {
  if (!connected) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 shadow-sm">
        Connect your wallet to see your staking position.
      </div>
    );
  }

  if (position.loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-400 shadow-sm">
        Loading position…
      </div>
    );
  }

  if (position.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
        <p className="font-medium">Could not load your position.</p>
        <p className="mt-1 break-words font-mono text-xs">{position.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Bucket
        label="Staked"
        amount={formatNear(position.staked)}
        unit="NEAR"
        accent="emerald"
        hint="Earning rewards on thecoding.pool.near"
      />

      <Bucket
        label={position.withdrawalAvailable ? "Withdrawable" : "Unstaking"}
        amount={formatNear(position.unstaked)}
        unit="NEAR"
        accent={position.withdrawalAvailable ? "sky" : "amber"}
        hint={
          position.unstaked && position.unstaked !== "0"
            ? position.withdrawalAvailable
              ? "Available to withdraw or restake"
              : `Locked — withdrawable in ~4 epochs (~7.5h each); contract is the gate`
            : "No unstaked funds"
        }
      />

      <Bucket
        label="Liquid (wallet)"
        amount={formatNear(position.liquid.toString())}
        unit="NEAR"
        accent="neutral"
        hint="Available to stake"
      />

      {position.fee && position.totalStaked && (
        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
          <span>
            Pool fee:{" "}
            <span className="font-medium text-neutral-700">
              {((position.fee.numerator / position.fee.denominator) * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            Pool total staked:{" "}
            <span className="font-medium text-neutral-700">{formatNear(position.totalStaked)} NEAR</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Bucket({
  label,
  amount,
  unit,
  accent,
  hint,
}: {
  label: string;
  amount: string;
  unit: string;
  accent: "emerald" | "amber" | "sky" | "neutral";
  hint: string;
}) {
  const accentMap = {
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    sky: "border-sky-200 bg-sky-50",
    neutral: "border-neutral-200 bg-neutral-50",
  };
  return (
    <div className={`rounded-2xl border ${accentMap[accent]} px-5 py-4 shadow-sm`}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <span className="text-xl font-semibold text-neutral-900">
          {amount} <span className="text-sm font-normal text-neutral-400">{unit}</span>
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  );
}

import { Panel } from "./ui/Panel";
import { Chip } from "./ui/Chip";
import { StatRow } from "./ui/StatRow";
import { POOL_ID, EPOCH_HOURS_ESTIMATE, UNBONDING_EPOCHS } from "../config";
import { formatNear, yoctoToNear } from "../lib/near";
import { truncateAccountId } from "../lib/format";
import type { PoolPosition } from "../hooks/usePoolAccount";

const UNBOND_HOURS_ESTIMATE = UNBONDING_EPOCHS * EPOCH_HOURS_ESTIMATE;

export function PositionPanel({
  position,
  connected,
  accountId,
}: {
  position: PoolPosition;
  connected: boolean;
  accountId: string | null;
}) {
  const unstakedNear = yoctoToNear(position.unstaked);
  const hasUnstaked = unstakedNear > 0;

  const unstakeLabel = !hasUnstaked
    ? "unstaked"
    : position.withdrawalAvailable
      ? "withdrawable"
      : "unstaking";

  const unstakeHint = !hasUnstaked ? (
    "no unstaked funds"
  ) : position.withdrawalAvailable ? (
    <>
      <Chip variant="solid">ready</Chip> withdraw or restake
    </>
  ) : (
    <>
      <Chip variant="dashed">locked ~{UNBOND_HOURS_ESTIMATE}h · est</Chip> the
      contract is the gate
    </>
  );

  return (
    <Panel
      title="~/position"
      ariaLabel="your position"
      status={
        connected ? <Chip>read: rpc</Chip> : <Chip variant="dashed">no wallet</Chip>
      }
      foot={
        connected && accountId ? (
          <>
            <span>pool · {POOL_ID}</span>
            <span>
              account ·{" "}
              <span className="font-mono">
                {accountId.startsWith("0x")
                  ? `${truncateAccountId(accountId)} (eth-implicit)`
                  : accountId}
              </span>
            </span>
          </>
        ) : null
      }
    >
      {!connected ? (
        <p className="text-[13.5px] leading-normal text-ink-70">
          connect a wallet to see your position; or look up any account
          read-only below, no wallet needed.
        </p>
      ) : position.loading ? (
        <p className="text-[13.5px] leading-normal text-ink-60">
          loading position…
        </p>
      ) : position.error ? (
        <div>
          <p className="font-mono text-xs text-error">
            could not load your position.
          </p>
          <p className="mt-2 break-words font-mono text-[11px] text-ink-60">
            {position.error}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 max-[520px]:grid-cols-1 max-[520px]:gap-y-0">
          <div className="max-[520px]:pb-3.5">
            <StatRow
              accent
              label="staked"
              value={formatNear(position.staked)}
              unit="Ⓝ"
              hint={
                <>
                  earning rewards on{" "}
                  <span className="font-mono">{POOL_ID}</span>
                </>
              }
            />
          </div>
          <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
            <StatRow
              label={unstakeLabel}
              value={formatNear(position.unstaked)}
              unit="Ⓝ"
              hint={unstakeHint}
            />
          </div>
          <div className="max-[520px]:border-t max-[520px]:border-dashed max-[520px]:border-ink-25 max-[520px]:py-3.5">
            <StatRow
              label="liquid"
              value={formatNear(position.liquid.toString())}
              unit="Ⓝ"
              hint="in your wallet, free to stake"
            />
          </div>
        </div>
      )}
    </Panel>
  );
}

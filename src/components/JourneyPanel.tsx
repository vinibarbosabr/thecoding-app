import { useEffect, useState } from "react";
import type { Action } from "near-connect-hooks";
import { Panel } from "./ui/Panel";
import { Chip, ChipAction } from "./ui/Chip";
import { Btn } from "./ui/Btn";
import { HelpDisclosure } from "./ui/HelpDisclosure";
import { inputCls } from "./ui/inputStyles";
import { LookupForm } from "./LookupForm";
import {
  POOL_ID,
  LIQUID_BUFFER_NEAR,
  EPOCH_HOURS_ESTIMATE,
  UNBONDING_EPOCHS,
} from "../config";
import {
  stakeBuilder,
  unstakeBuilder,
  unstakeAllBuilder,
  withdrawBuilder,
  withdrawAllBuilder,
  restakeBuilder,
} from "../lib/pool";
import {
  nearToYocto,
  yoctoToNear,
  normalizeDecimal,
  formatNear,
} from "../lib/near";
import { maxStakeNear } from "../hooks/usePoolAccount";
import type { PoolPosition } from "../hooks/usePoolAccount";

type JourneyState = "s0" | "s1" | "s2" | "s3" | "s4";

const STATE_NAMES: Record<JourneyState, string> = {
  s0: "disconnected",
  s1: "empty",
  s2: "staked",
  s3: "unbonding",
  s4: "withdrawable",
};

const BUFFER_NOTE = `keeps ≥ ${LIQUID_BUFFER_NEAR} Ⓝ liquid in your wallet for gas. amounts accept both . and , decimals.`;
const LOCK_NOTE = `unstaked funds lock for ${UNBONDING_EPOCHS} epochs (~${EPOCH_HOURS_ESTIMATE}h each) before withdrawal.`;
const UNBOND_HOURS_ESTIMATE = UNBONDING_EPOCHS * EPOCH_HOURS_ESTIMATE;

function deriveState(position: PoolPosition, connected: boolean): JourneyState {
  if (!connected) return "s0";
  if (yoctoToNear(position.unstaked) > 0) {
    return position.withdrawalAvailable ? "s4" : "s3";
  }
  if (yoctoToNear(position.staked) > 0) return "s2";
  return "s1";
}

function PresignLine({ method, deposit }: { method: string; deposit: string }) {
  return (
    <p className="mt-3 break-words font-mono text-[11px] leading-[1.6] text-ink-60">
      <span className="text-signal-ink">→</span> {POOL_ID}::{method} · 50 tgas ·{" "}
      {deposit}
    </p>
  );
}

function AmountAction({
  actionLabel,
  maxNear,
  disabled,
  pending,
  note,
  method,
  deposit,
  onSubmit,
}: {
  actionLabel: string;
  maxNear: number;
  disabled: boolean;
  pending: boolean;
  note: string;
  method: string;
  deposit: string;
  onSubmit: (amountNear: string) => void;
}) {
  const [raw, setRaw] = useState("");
  const value = normalizeDecimal(raw);
  const tooLarge = Number.isFinite(value) && value > maxNear;
  const invalid = !Number.isFinite(value) || value <= 0 || tooLarge;
  const error = !Number.isFinite(value) && raw
    ? "enter an amount"
    : Number.isFinite(value) && value <= 0 && raw
      ? "amount must be greater than zero"
      : tooLarge
        ? `exceeds available (${maxNear.toFixed(5)} near)`
        : null;
  const canSubmit = !invalid && !disabled && !pending;
  const maxLabel = maxNear.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-[1_1_170px]">
          <input
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="0.0"
            aria-label="amount in near"
            disabled={disabled}
            className={`${inputCls} pr-14`}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-40"
          >
            Ⓝ
          </span>
        </div>
        <ChipAction
          disabled={maxNear <= 0 || disabled}
          onClick={() => setRaw(maxNear > 0 ? String(maxNear) : "")}
        >
          max {maxLabel}
        </ChipAction>
        <Btn
          pending={pending}
          disabled={!canSubmit}
          onClick={() => canSubmit && onSubmit(String(value))}
        >
          {actionLabel}
        </Btn>
      </div>
      <PresignLine method={method} deposit={deposit} />
      <p
        className={`mt-2 text-[11.5px] leading-normal ${error && raw ? "text-error" : "text-ink-60"}`}
      >
        {error && raw ? error : note}
      </p>
    </div>
  );
}

export function JourneyPanel({
  position,
  connected,
  pending,
  onSign,
}: {
  position: PoolPosition;
  connected: boolean;
  pending: boolean;
  onSign: (actions: Action[]) => void;
}) {
  const state = deriveState(position, connected);
  const [alt, setAlt] = useState(false);

  useEffect(() => {
    setAlt(false);
  }, [state]);

  const stakedNear = yoctoToNear(position.staked);
  const unstakedNear = yoctoToNear(position.unstaked);
  const maxStake = maxStakeNear(position.liquid);

  const signAmount =
    (builder: (yocto: string) => Action[]) => (amountNear: string) =>
      onSign(builder(nearToYocto(amountNear)));
  const signAll = (builder: () => Action[]) => () => onSign(builder());

  return (
    <Panel
      title="~/actions"
      ariaLabel="actions"
      status={<Chip>state: {STATE_NAMES[state]}</Chip>}
    >
      {state === "s0" && <LookupForm />}

      {state === "s1" && (
        <>
          <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
            nothing staked yet. start here:
          </p>
          <AmountAction
            actionLabel="stake"
            maxNear={maxStake}
            disabled={pending || maxStake <= 0}
            pending={pending}
            note={BUFFER_NOTE}
            method="deposit_and_stake()"
            deposit="deposit attached"
            onSubmit={signAmount(stakeBuilder)}
          />
          <HelpDisclosure title="how staking works">
            <p>
              staking delegates your near to a validator (this pool). you keep
              custody: the contract credits your account, and only your wallet
              can move funds. rewards accrue every epoch
              (~{EPOCH_HOURS_ESTIMATE}h) and compound automatically into your
              staked balance.
            </p>
          </HelpDisclosure>
        </>
      )}

      {state === "s2" &&
        (alt ? (
          <>
            <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
              add more to your stake:
            </p>
            <AmountAction
              actionLabel="stake"
              maxNear={maxStake}
              disabled={pending || maxStake <= 0}
              pending={pending}
              note={BUFFER_NOTE}
              method="deposit_and_stake()"
              deposit="deposit attached"
              onSubmit={signAmount(stakeBuilder)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Btn variant="quiet" disabled={pending} onClick={() => setAlt(false)}>
                ‹ back to unstake
              </Btn>
              <Btn
                variant="text"
                disabled={pending}
                onClick={signAll(unstakeAllBuilder)}
              >
                unstake all
              </Btn>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
              you're staked. rewards flow automatically.
            </p>
            <AmountAction
              actionLabel="unstake"
              maxNear={stakedNear}
              disabled={pending || stakedNear <= 0}
              pending={pending}
              note={LOCK_NOTE}
              method="unstake()"
              deposit="0 deposit"
              onSubmit={signAmount(unstakeBuilder)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Btn variant="quiet" disabled={pending} onClick={() => setAlt(true)}>
                stake more
              </Btn>
              <Btn
                variant="text"
                disabled={pending}
                onClick={signAll(unstakeAllBuilder)}
              >
                unstake all
              </Btn>
            </div>
            <HelpDisclosure title="how staking works">
              <p>
                staking delegates your near to a validator (this pool). you
                keep custody: the contract credits your account, and only your
                wallet can move funds. rewards accrue every epoch
                (~{EPOCH_HOURS_ESTIMATE}h) and compound automatically into
                your staked balance.
              </p>
            </HelpDisclosure>
          </>
        ))}

      {state === "s3" && (
        <>
          <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
            part of your funds are unbonding. nothing to do but wait; the
            contract unlocks them after {UNBONDING_EPOCHS} full epochs.
          </p>
          <AmountAction
            actionLabel="stake more"
            maxNear={maxStake}
            disabled={pending || maxStake <= 0}
            pending={pending}
            note={BUFFER_NOTE}
            method="deposit_and_stake()"
            deposit="deposit attached"
            onSubmit={signAmount(stakeBuilder)}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Chip variant="dashed">
              {formatNear(position.unstaked)} Ⓝ locked · ~
              {UNBOND_HOURS_ESTIMATE}h est
            </Chip>
            <span className="text-[11.5px] leading-normal text-ink-60">
              the contract is the gate; the estimate can drift.
            </span>
          </div>
          <HelpDisclosure title="why the wait?">
            <p>
              near requires unstaked funds to sit for {UNBONDING_EPOCHS} epochs
              (~{EPOCH_HOURS_ESTIMATE}h each) before they can be withdrawn.
              this is protocol security, not a pool rule. the app reads
              availability straight from the contract: when it says ready, the
              withdraw button lights up.
            </p>
          </HelpDisclosure>
        </>
      )}

      {state === "s4" &&
        (alt ? (
          <>
            <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
              put your unstaked funds back to work:
            </p>
            <AmountAction
              actionLabel="restake"
              maxNear={unstakedNear}
              disabled={pending || !position.withdrawalAvailable}
              pending={pending}
              note="re-stakes your withdrawable funds without a new deposit."
              method="stake()"
              deposit="0 deposit"
              onSubmit={signAmount(restakeBuilder)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Btn variant="quiet" disabled={pending} onClick={() => setAlt(false)}>
                ‹ back to withdraw
              </Btn>
              <Btn
                variant="text"
                disabled={pending || !position.withdrawalAvailable}
                onClick={signAll(withdrawAllBuilder)}
              >
                withdraw all
              </Btn>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
              unstaked funds are ready. move them or put them back to work.
            </p>
            <AmountAction
              actionLabel="withdraw"
              maxNear={unstakedNear}
              disabled={pending || !position.withdrawalAvailable}
              pending={pending}
              note="sends funds back to your wallet."
              method="withdraw()"
              deposit="0 deposit"
              onSubmit={signAmount(withdrawBuilder)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Btn variant="quiet" disabled={pending} onClick={() => setAlt(true)}>
                restake
              </Btn>
              <Btn
                variant="text"
                disabled={pending || !position.withdrawalAvailable}
                onClick={signAll(withdrawAllBuilder)}
              >
                withdraw all
              </Btn>
            </div>
          </>
        ))}
    </Panel>
  );
}

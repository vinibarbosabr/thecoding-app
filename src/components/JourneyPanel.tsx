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
import { deriveJourney } from "../lib/journey";
import type { JourneyState } from "../lib/journey";
import type { PoolPosition } from "../hooks/usePoolAccount";

type Mode = "default" | "unstake" | "stake" | "restake";

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
  const { state, canUnstake, canMoveUnstaked } = deriveJourney({
    connected,
    staked: position.staked,
    unstaked: position.unstaked,
    withdrawalAvailable: position.withdrawalAvailable,
  });
  const [mode, setMode] = useState<Mode>("default");

  useEffect(() => {
    setMode("default");
  }, [state]);

  const stakedNear = yoctoToNear(position.staked);
  const unstakedNear = yoctoToNear(position.unstaked);
  const maxStake = maxStakeNear(position.liquid);
  const canStake = maxStake > 0;

  const signAmount =
    (builder: (yocto: string) => Action[]) => (amountNear: string) =>
      onSign(builder(nearToYocto(amountNear)));
  const signAll = (builder: () => Action[]) => () => onSign(builder());

  const stakeForm = (
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
  );
  const unstakeForm = (
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
  );

  const back = (label: string) => (
    <Btn variant="quiet" disabled={pending} onClick={() => setMode("default")}>
      {label}
    </Btn>
  );
  const allActions = (
    <>
      {canMoveUnstaked && (
        <Btn
          variant="text"
          disabled={pending}
          onClick={signAll(withdrawAllBuilder)}
        >
          withdraw all
        </Btn>
      )}
      {canUnstake && (
        <Btn
          variant="text"
          disabled={pending}
          onClick={signAll(unstakeAllBuilder)}
        >
          unstake all
        </Btn>
      )}
    </>
  );

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
          {stakeForm}
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

      {state === "s2" && (
        <>
          <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
            {mode === "stake"
              ? "add more to your stake:"
              : "you're staked. rewards flow automatically."}
          </p>
          {mode === "stake" ? stakeForm : unstakeForm}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {mode === "stake" && back("‹ back to unstake")}
            {mode === "default" && canStake && (
              <Btn variant="quiet" disabled={pending} onClick={() => setMode("stake")}>
                stake more
              </Btn>
            )}
            {allActions}
          </div>
          {mode === "default" && (
            <HelpDisclosure title="how staking works">
              <p>
                staking delegates your near to a validator (this pool). you
                keep custody: the contract credits your account, and only your
                wallet can move funds. rewards accrue every epoch
                (~{EPOCH_HOURS_ESTIMATE}h) and compound automatically into
                your staked balance.
              </p>
            </HelpDisclosure>
          )}
        </>
      )}

      {state === "s3" && (
        <>
          <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
            {mode === "unstake"
              ? "unstake more of your staked near:"
              : `part of your funds are unbonding. nothing to do but wait; the contract unlocks them after ${UNBONDING_EPOCHS} full epochs.`}
          </p>
          {mode === "unstake" ? (
            unstakeForm
          ) : (
            canStake && stakeForm
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {mode === "unstake" && back("‹ back to stake more")}
            {mode === "default" && canUnstake && (
              <Btn variant="quiet" disabled={pending} onClick={() => setMode("unstake")}>
                unstake
              </Btn>
            )}
            {allActions}
          </div>
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

      {state === "s4" && (
        <>
          <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
            {mode === "restake"
              ? "put your unstaked funds back to work:"
              : mode === "unstake"
                ? "unstake more of your staked near:"
                : mode === "stake"
                  ? "add more to your stake:"
                  : "unstaked funds are ready. move them or put them back to work."}
          </p>
          {mode === "restake" ? (
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
          ) : mode === "unstake" ? (
            unstakeForm
          ) : mode === "stake" ? (
            stakeForm
          ) : (
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
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {mode !== "default" && back("‹ back to withdraw")}
            {mode === "default" && canMoveUnstaked && (
              <Btn variant="quiet" disabled={pending} onClick={() => setMode("restake")}>
                restake
              </Btn>
            )}
            {mode === "default" && canUnstake && (
              <Btn variant="quiet" disabled={pending} onClick={() => setMode("unstake")}>
                unstake
              </Btn>
            )}
            {mode === "default" && canStake && (
              <Btn variant="quiet" disabled={pending} onClick={() => setMode("stake")}>
                stake more
              </Btn>
            )}
            {allActions}
          </div>
        </>
      )}
    </Panel>
  );
}

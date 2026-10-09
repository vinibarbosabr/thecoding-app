import { useState } from "react";
import type { FormEvent } from "react";
import { Btn } from "./ui/Btn";
import { inputCls } from "./ui/inputStyles";
import { useAccountLookup } from "../hooks/useAccountLookup";
import { formatNear } from "../lib/near";
import { truncateAccountId } from "../lib/format";

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs leading-[1.7]">
      <span className="text-ink-60">{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  );
}

export function LookupForm() {
  const { state, lookup } = useAccountLookup();
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = value.trim();
    if (id) lookup(id);
  };

  return (
    <div>
      <p className="mb-4 text-[13.5px] leading-normal text-ink-70">
        curious where you stand? look up any account, including{" "}
        <span className="font-mono">0x…</span> eth-implicit ones. read-only,
        public rpc, no signing.
      </p>
      <form className="flex flex-wrap items-center gap-2.5" onSubmit={submit}>
        <div className="min-w-0 flex-[1_1_220px]">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="account id or 0x address"
            aria-label="account id to look up"
            className={inputCls}
          />
        </div>
        <Btn
          type="submit"
          pending={state.status === "loading"}
          pendingLabel="looking up…"
        >
          lookup
        </Btn>
      </form>
      {state.status === "error" && (
        <p className="mt-2.5 font-mono text-xs text-error">{state.message}</p>
      )}
      {state.status === "done" && (
        <div className="mt-3.5 rounded-control border border-dashed border-ink-25 px-3.5 py-3">
          <ResultRow label="account" value={truncateAccountId(state.accountId)} />
          <ResultRow
            label="staked"
            value={`${formatNear(state.account.staked_balance)} Ⓝ`}
          />
          <ResultRow
            label="unstaked"
            value={`${formatNear(state.account.unstaked_balance)} Ⓝ`}
          />
          <ResultRow
            label="withdrawable"
            value={state.account.withdrawal_available ? "yes" : "no"}
          />
          <p className="mt-2.5 font-mono text-[10.5px] leading-normal text-ink-60">
            read-only view call on public rpc. no wallet was touched.
          </p>
        </div>
      )}
    </div>
  );
}

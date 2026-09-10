import { useState, useMemo } from "react";
import { normalizeDecimal } from "../lib/near";

type Validation =
  | { ok: true; valueNear: number }
  | { ok: false; error: string };

export function AmountForm({
  label,
  actionLabel,
  maxNear,
  disabled,
  pending,
  accent,
  onSubmit,
  extraNote,
}: {
  label: string;
  actionLabel: string;
  maxNear: number;
  disabled: boolean;
  pending: boolean;
  accent: "emerald" | "amber" | "sky";
  onSubmit: (amountNear: string) => void;
  extraNote?: string;
}) {
  const [raw, setRaw] = useState("");

  const validation = useMemo<Validation>(() => {
    const value = normalizeDecimal(raw);
    if (!Number.isFinite(value)) return { ok: false, error: "Enter an amount" };
    if (value <= 0) return { ok: false, error: "Amount must be greater than zero" };
    if (value > maxNear) return { ok: false, error: `Exceeds available (${maxNear.toFixed(5)} NEAR)` };
    return { ok: true, valueNear: value };
  }, [raw, maxNear]);

  const canSubmit = validation.ok && !disabled && !pending;

  const accentMap = {
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    amber: "bg-amber-500 hover:bg-amber-600",
    sky: "bg-sky-500 hover:bg-sky-600",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">{label}</label>
        <button
          type="button"
          onClick={() => setRaw(maxNear > 0 ? maxNear.toFixed(5) : "")}
          disabled={maxNear <= 0 || disabled}
          className="rounded-md px-2 py-0.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-40"
        >
          Max {maxNear > 0 ? maxNear.toFixed(5) : "0"}
        </button>
      </div>

      <div className="flex items-stretch gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0.0"
          disabled={disabled}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-neutral-400 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
        />
        <button
          type="button"
          onClick={() => canSubmit && onSubmit(validation.ok ? String(validation.valueNear) : "")}
          disabled={!canSubmit}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${accentMap[accent]}`}
        >
          {pending ? "Signing…" : actionLabel}
        </button>
      </div>

      <p className="mt-2 h-4 text-xs text-red-500">
        {!validation.ok && raw ? validation.error : extraNote ?? ""}
      </p>
    </div>
  );
}

import type { ReactNode } from "react";

export function StatRow({
  label,
  value,
  unit,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60">
        {label}
      </div>
      <div
        className={`flex flex-wrap items-baseline gap-1.5 font-mono text-xl font-semibold leading-[1.1] tabular-nums ${
          accent ? "text-signal-ink" : "text-ink"
        }`}
      >
        {value}
        {unit ? (
          <span className="text-[11px] font-normal text-ink-60">{unit}</span>
        ) : null}
      </div>
      {hint ? (
        <div className="mt-2 flex max-w-[30ch] flex-wrap items-center gap-1.5 text-[11.5px] leading-snug text-ink-60">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

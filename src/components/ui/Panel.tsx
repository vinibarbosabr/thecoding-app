import type { ReactNode } from "react";

export function Panel({
  title,
  status,
  foot,
  ariaLabel,
  children,
}: {
  title: string;
  status?: ReactNode;
  foot?: ReactNode;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className="mt-[22px] rounded-panel border border-ink-25 bg-surface"
    >
      <div className="flex items-center gap-2.5 border-b border-ink-25 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="block h-[9px] w-[9px] rounded-full border border-ink-40" />
          <i className="block h-[9px] w-[9px] rounded-full border border-ink-40" />
          <i className="block h-[9px] w-[9px] rounded-full border border-ink-40" />
        </span>
        <span className="font-mono text-[11px] leading-none tracking-[0.08em] text-ink-60">
          {title}
        </span>
        <span className="ml-auto">{status}</span>
      </div>
      <div className="px-5 pb-5 pt-[18px]">{children}</div>
      {foot ? (
        <div className="flex flex-wrap gap-x-[18px] gap-y-0.5 border-t border-dashed border-ink-25 px-5 py-2.5 font-mono text-[11px] leading-[1.6] text-ink-60">
          {foot}
        </div>
      ) : null}
    </section>
  );
}

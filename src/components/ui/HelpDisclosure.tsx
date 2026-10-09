import type { ReactNode } from "react";

export function HelpDisclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group mt-4">
      <summary className="flex min-h-[40px] cursor-pointer list-none items-center gap-2 font-mono text-[11px] leading-none tracking-[0.06em] text-ink-60 transition duration-[120ms] hover:text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="text-ink-40 group-open:hidden">
          ▸
        </span>
        <span aria-hidden="true" className="hidden text-ink-40 group-open:inline">
          ▾
        </span>
        {title}
      </summary>
      <div className="max-w-[60ch] py-1.5 pl-4 text-[13px] leading-[1.55] text-ink-70">
        {children}
      </div>
    </details>
  );
}

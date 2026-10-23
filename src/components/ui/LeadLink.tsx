/**
 * Full-width route lead between the hub and the #/data view
 * (ADR-04 §1): the two surfaces cross-link prominently, not
 * through dim foot lines. ADR-03 tokens only.
 */
export function LeadLink({
  href,
  back = false,
  title,
  description,
}: {
  href: string;
  back?: boolean;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group mt-[22px] flex items-center gap-3.5 rounded-panel border border-ink-25 bg-surface px-4 py-3.5 transition duration-[120ms] hover:border-signal-ink"
    >
      <span
        aria-hidden="true"
        className="font-mono text-sm font-semibold leading-none text-signal-ink"
      >
        {back ? "←" : "→"}
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-mono text-[13px] font-semibold leading-none tracking-[0.01em] text-ink transition duration-[120ms] group-hover:text-signal-ink">
          {title}
        </span>
        <span className="text-[11px] leading-[1.45] text-ink-60">
          {description}
        </span>
      </span>
    </a>
  );
}
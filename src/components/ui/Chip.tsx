import type { ButtonHTMLAttributes, ReactNode } from "react";

const chipCls =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip border border-ink-25 px-2.5 py-[5px] font-mono text-[11px] leading-none text-ink-70";

export function Chip({
  variant = "plain",
  children,
}: {
  variant?: "plain" | "solid" | "dashed";
  children: ReactNode;
}) {
  const variantCls =
    variant === "solid"
      ? "border-transparent bg-signal text-on-accent"
      : variant === "dashed"
        ? "border-dashed text-ink-60"
        : "";
  return <span className={`${chipCls} ${variantCls}`}>{children}</span>;
}

export function ChipAction({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${chipCls} cursor-pointer transition duration-[120ms] hover:bg-ink-10 hover:text-ink disabled:cursor-default disabled:opacity-40 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ChipDot() {
  return (
    <span
      aria-hidden="true"
      className="block h-[7px] w-[7px] rounded-full bg-signal"
    />
  );
}

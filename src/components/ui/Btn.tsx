import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "quiet" | "text";
type Size = "md" | "sm";

const base =
  "cursor-pointer transition duration-[120ms] disabled:cursor-default disabled:opacity-40";

const styles: Record<string, string> = {
  primary:
    "min-h-[40px] rounded-control bg-signal px-[18px] font-mono text-[13px] font-semibold leading-none text-on-accent hover:brightness-[1.08]",
  "primary sm":
    "min-h-[32px] rounded-control bg-signal px-2.5 font-mono text-[11px] font-semibold leading-none text-on-accent hover:brightness-[1.08]",
  quiet:
    "min-h-[40px] rounded-control border border-ink-25 px-3.5 font-mono text-[13px] font-normal leading-none text-ink-70 hover:border-ink-40 hover:bg-ink-10 hover:text-ink",
  "quiet sm":
    "min-h-[32px] rounded-control border border-ink-25 px-2.5 font-mono text-[11px] font-normal leading-none text-ink-70 hover:border-ink-40 hover:bg-ink-10 hover:text-ink",
  "quiet icon":
    "min-h-[40px] rounded-control border border-ink-25 px-3 font-mono text-sm font-normal leading-none text-ink-70 hover:border-ink-40 hover:bg-ink-10 hover:text-ink",
  text: "min-h-[40px] px-0.5 font-mono text-xs font-normal leading-none text-ink-60 underline decoration-dotted decoration-ink-25 underline-offset-4 hover:text-ink hover:decoration-ink-60",
};

const wideCls = "w-full max-w-[320px] max-[520px]:max-w-none";

export function Btn({
  variant = "primary",
  size = "md",
  wide,
  icon,
  pending,
  pendingLabel = "signing…",
  children,
  className,
  type = "button",
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  wide?: boolean;
  icon?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const key = icon && variant === "quiet" ? "quiet icon" : `${variant} ${size}`;
  return (
    <button
      type={type}
      disabled={pending || rest.disabled}
      className={[base, styles[key], wide ? wideCls : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

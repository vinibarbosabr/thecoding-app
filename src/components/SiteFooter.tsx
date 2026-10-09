import { POOL_ID } from "../config";

const LINKS = [
  { href: "https://thecoding.dev", label: "thecoding.dev" },
  { href: "https://thecoding.substack.com", label: "newsletter" },
  { href: "https://x.com/vinibarbosabr", label: "x" },
  { href: "https://github.com/vinibarbosabr/thecoding-app", label: "github" },
  {
    href: "https://docs.near.org/protocol/network/staking",
    label: "near staking docs",
  },
];

const linkCls =
  "text-ink-70 underline decoration-ink-25 underline-offset-[3px] transition duration-[120ms] hover:text-signal-ink hover:decoration-signal-ink";

export function SiteFooter() {
  return (
    <footer className="mt-11 flex flex-col gap-2.5 border-t border-ink-25 pb-6 pt-4">
      <nav
        aria-label="ecosystem"
        className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[11px] leading-[1.8]"
      >
        {LINKS.map((link, i) => (
          <span key={link.href} className="flex items-center gap-2.5">
            {i > 0 && (
              <span aria-hidden="true" className="self-center text-ink-25">
                ·
              </span>
            )}
            <a href={link.href} target="_blank" rel="noreferrer" className={linkCls}>
              {link.label}
            </a>
          </span>
        ))}
      </nav>
      <p className="max-w-[64ch] text-xs leading-[1.55] text-ink-60">
        this app builds the transaction; your wallet signs it. the receiver is
        always{" "}
        <a
          href={`https://nearblocks.io/address/${POOL_ID}`}
          target="_blank"
          rel="noreferrer"
          className={`font-mono ${linkCls}`}
        >
          {POOL_ID}
        </a>
        ; reject any popup showing a different contract.
      </p>
    </footer>
  );
}

import { NEARBLOCKS_TX_BASE } from "../config";

const toastCls =
  "fixed bottom-4 right-4 z-40 rounded-panel border border-ink-25 bg-surface px-4 py-3 text-[13px] text-ink shadow-pop";

export function TxToast({
  hash,
  pending,
  error,
}: {
  hash: string | null;
  pending: boolean;
  error: string | null;
}) {
  if (pending && !hash) {
    return <div className={toastCls}>waiting for wallet signature…</div>;
  }

  if (error) {
    return (
      <div className={`${toastCls} max-w-sm`}>
        <p className="font-semibold text-error">transaction failed</p>
        <p className="mt-1 break-words font-mono text-xs text-ink-60">{error}</p>
      </div>
    );
  }

  if (hash) {
    return (
      <a
        href={`${NEARBLOCKS_TX_BASE}${hash}`}
        target="_blank"
        rel="noreferrer"
        className={`${toastCls} transition duration-[120ms] hover:text-signal-ink`}
      >
        <p className="font-semibold text-signal-ink">transaction submitted</p>
        <p className="mt-0.5 font-mono text-xs text-ink-60 underline">
          {hash.slice(0, 18)}… → nearblocks
        </p>
      </a>
    );
  }

  return null;
}

import { NEARBLOCKS_TX_BASE } from "../config";

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
    return (
      <div className="fixed bottom-4 right-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-lg">
        Waiting for wallet signature…
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
        <p className="font-medium">Transaction failed</p>
        <p className="mt-1 break-words font-mono text-xs">{error}</p>
      </div>
    );
  }

  if (hash) {
    return (
      <a
        href={`${NEARBLOCKS_TX_BASE}${hash}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg transition hover:bg-emerald-100"
      >
        <p className="font-medium">Transaction submitted</p>
        <p className="mt-0.5 font-mono text-xs underline">{hash.slice(0, 18)}… → NearBlocks</p>
      </a>
    );
  }

  return null;
}

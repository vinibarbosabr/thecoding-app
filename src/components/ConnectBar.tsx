import { useNearWallet } from "near-connect-hooks";

export function ConnectBar() {
  const wallet = useNearWallet();
  const accountId = wallet.signedAccountId;

  if (wallet.loading) {
    return (
      <div className="flex justify-end py-3 text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="flex justify-end py-3">
        <button
          onClick={() => wallet.signIn()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600"
        >
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3">
      <span className="truncate font-mono text-sm text-neutral-600" title={accountId}>
        {accountId}
      </span>
      <button
        onClick={() => wallet.signOut()}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
      >
        Disconnect
      </button>
    </div>
  );
}

import { useEffect } from "react";
import { NearProvider, useNearWallet } from "near-connect-hooks";
import { NETWORK, RPC_URLS } from "./config";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { Backdrop } from "./components/Backdrop";
import { PositionPanel } from "./components/PositionPanel";
import { PoolStrip } from "./components/PoolStrip";
import { JourneyPanel } from "./components/JourneyPanel";
import { FaqPanel } from "./components/FaqPanel";
import { DataView } from "./components/DataView";
import { TxToast } from "./components/TxToast";
import { usePoolAccount } from "./hooks/usePoolAccount";
import { useTx } from "./hooks/useTx";
import { useTheme } from "./hooks/useTheme";
import { useHashRoute } from "./hooks/useHashRoute";

export default function App() {
  return (
    <NearProvider config={{ network: NETWORK, providers: { mainnet: RPC_URLS } }}>
      <Shell />
    </NearProvider>
  );
}

function Shell() {
  const wallet = useNearWallet();
  const connected = Boolean(wallet.signedAccountId);
  const position = usePoolAccount();
  const tx = useTx(position.refetch);
  const { toggle } = useTheme();
  const route = useHashRoute();
  const showData = route === "data";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showData]);

  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <div className="relative z-10 mx-auto max-w-[672px] px-5 pt-6 max-[520px]:px-4 max-[520px]:pt-[18px]">
        <SiteHeader onToggleTheme={toggle} />
        <main>
          {showData ? (
            <DataView />
          ) : (
            <>
              <PositionPanel
                position={position}
                connected={connected}
                accountId={wallet.signedAccountId ?? null}
              />
              <PoolStrip />
              <JourneyPanel
                position={position}
                connected={connected}
                pending={tx.pending}
                onSign={tx.sign}
              />
              <FaqPanel />
            </>
          )}
        </main>
        <SiteFooter />
      </div>
      <TxToast hash={tx.lastTxHash} pending={tx.pending} error={tx.error} />
    </div>
  );
}

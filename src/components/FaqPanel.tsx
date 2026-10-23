import { useEffect, useState } from "react";
import { Panel } from "./ui/Panel";
import { Chip } from "./ui/Chip";
import { HelpDisclosure } from "./ui/HelpDisclosure";
import { fetchPoolStats } from "../lib/networkRead";
import { POOL_ID, EPOCH_HOURS_ESTIMATE, UNBONDING_EPOCHS } from "../config";

const UNBOND_HOURS_ESTIMATE = UNBONDING_EPOCHS * EPOCH_HOURS_ESTIMATE;
const STAKING_DOCS_URL = "https://docs.near.org/protocol/network/staking";

export function FaqPanel() {
  const [feePct, setFeePct] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPoolStats()
      .then((stats) => {
        if (!cancelled) {
          setFeePct((stats.fee.numerator / stats.fee.denominator) * 100);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const feeText =
    feePct === null ? "a share of" : `${feePct.toFixed(0)}% of`;

  return (
    <Panel
      title="~/faq"
      ariaLabel="frequently asked questions"
      status={<Chip>help</Chip>}
      foot={
        <a
          href={STAKING_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="text-signal-ink underline decoration-ink-25 underline-offset-[3px] transition duration-[120ms] hover:decoration-signal-ink"
        >
          near staking docs →
        </a>
      }
    >
      <HelpDisclosure title="can thecoding move or lose my staked near?">
        no. your stake lives in the staking pool smart contract, not in
        thecoding&apos;s own account. deposits credit the account that
        signed them, only that account can unstake or withdraw, and
        withdrawals always return to the account that made the deposit.
        thecoding runs the validator node and takes a fee from rewards;
        it cannot move your principal. before every signature the wallet
        popup shows the receiver: it is always{" "}
        <span className="font-mono">{POOL_ID}</span> calling one of the
        six documented methods. reject anything else.
      </HelpDisclosure>
      <HelpDisclosure title="how long until unstaked near is back in my wallet?">
        unstaking does not send the near back by itself; it waits in the
        pool. you sign two steps: unstake starts a {UNBONDING_EPOCHS}
        epoch wait (~{EPOCH_HOURS_ESTIMATE}h each, about{" "}
        {UNBOND_HOURS_ESTIMATE}h) enforced by the pool contract, and once
        the contract marks the balance as available you sign withdraw to
        receive it. the countdown in this app is an estimate; the
        contract is the gate, and the withdraw control only wakes up
        when the pool actually allows it.
      </HelpDisclosure>
      <HelpDisclosure title="when and how do rewards arrive?">
        rewards accrue every epoch (~{EPOCH_HOURS_ESTIMATE}h) and are
        folded into your staked balance automatically by the pool&apos;s
        share accounting. there is no claim transaction; your staked
        balance simply grows. thecoding&apos;s fee is {feeText} rewards,
        never of your principal. the live estimate is the apy cell in
        the ~/pool strip above, net of fee.
      </HelpDisclosure>
    </Panel>
  );
}

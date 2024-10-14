import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const l1Finding = (_l1OptEscrowBalance: string, _l1ArbEscrowBalance: string): Finding => {
  return Finding.fromObject({
    name: `Maker L2 Bridge: Supply of DAI in L1 Escrow Contracts for Optimism and Arbitrum`,
    description: `DAI locked for Optimism: ${_l1OptEscrowBalance}. DAI locked for Arbitrum: ${_l1OptEscrowBalance}.`,
    alertId: "L1-DAI-LOCKED",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Ethereum",
    metadata: {
      l1OptEscrowBalance: _l1OptEscrowBalance,
      l1ArbEscrowBalance: _l1ArbEscrowBalance,
    },
  });
};

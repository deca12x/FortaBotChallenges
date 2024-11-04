import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const l1Finding = (_l1OptEscrowBalance: string, _l1ArbEscrowBalance: string): Finding => {
  return Finding.fromObject({
    name: `Maker L2 Bridge: DAI Locked in L1 Escrow Contracts for Optimism and Arbitrum`,
    description: `DAI locked for Optimism: ${_l1OptEscrowBalance}. DAI locked for Arbitrum: ${_l1ArbEscrowBalance}.`,
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

export const l2Finding = (_l1DaiLocked: string, _l2DaiSupply: string, _chainId: number): Finding => {
  const chainName = _chainId === 10 ? "Optimism" : "Arbitrum";
  return Finding.fromObject({
    name: `Maker L2 Bridge: DAI Locked in L1 Escrow Contract for ${chainName} is greater than L2 DAI Supply`,
    description: `L1 DAI Locked: ${_l1DaiLocked}. L2 (${chainName}) DAI Supply: ${_l2DaiSupply}.`,
    alertId: "BRIDGE-BREACHED",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    protocol: chainName,
    metadata: {
      l1DaiLocked: _l1DaiLocked,
      l2DaiSupply: _l2DaiSupply,
    },
  });
};

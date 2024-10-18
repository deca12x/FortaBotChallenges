import { Finding, FindingSeverity, FindingType, ethers, Alert, AlertsResponse, getAlerts } from "forta-agent";
import { L2_DAI_TOKEN_ADDRESS, L2_TOKEN_ABI } from "./constants";
import { Provider } from "@ethersproject/providers";

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

export const emitAlert = (_l1OptEscrowBalance: string, _l1ArbEscrowBalance: string) => {
  const l1DaiLockedChangeAlert: Alert = {
    alertId: "L1-DAI-LOCKED-CHANGE",
    hasAddress: () => false,
    metadata: {
      l1OptEscrowBalance: ethers.BigNumber,
      l1ArbEscrowBalance: ethers.BigNumber,
    },
  };
  const l1DaiLockedChangeAlertsResponse: AlertsResponse = {
    alerts: [l1DaiLockedChangeAlert],
    pageInfo: { hasNextPage: false },
  };
  l1DaiLockedChangeAlertsResponse.alerts[0].metadata.latestL1OptEscrowBalance = _l1OptEscrowBalance;
  l1DaiLockedChangeAlertsResponse.alerts[0].metadata.latestL1ArbEscrowBalance = _l1ArbEscrowBalance;
};

const getL1Alerts = async (chainId: number): Promise<AlertsResponse> => {
  console.log("1");
  return await getAlerts({
    alertId: "L1-DAI-LOCKED-CHANGE",
    chainId: chainId,
  });
};

export const getL1DaiLocked = async (l2ChainId: number): Promise<ethers.BigNumber> => {
  const l1Alerts = await getL1Alerts(l2ChainId);
  const metadata = l1Alerts.alerts[0].metadata;
  const l1DaiLocked = l2ChainId === 10 ? metadata.l1OptEscrowBalance : metadata.l1ArbEscrowBalance;
  return l1DaiLocked;
};

export const getL2DaiSupply = async (blNumber: number, provider: Provider): Promise<ethers.BigNumber> => {
  const l2DaiContract = new ethers.Contract(L2_DAI_TOKEN_ADDRESS, L2_TOKEN_ABI, provider);
  const l2DaiSupply = await l2DaiContract.totalSupply({ blockTag: blNumber });
  const l2BigNumber = ethers.BigNumber.from(l2DaiSupply);
  return l2BigNumber;
};

import { Finding, FindingSeverity, FindingType, ethers, Alert, AlertsResponse, getAlerts } from "forta-agent";
import { L2_DAI_TOKEN_ADDRESS, L2_TOKEN_ABI } from "./constants";
import { Provider } from "@ethersproject/providers";

export type GetAlertsFunction = (options: {
  botIds: string[]; // required per docs
  alertId?: string; // we use this
  chainId?: number; // we use this
}) => Promise<AlertsResponse>;

export const getL1DaiLocked = async (
  l2ChainId: number,
  getAlertsFunc: GetAlertsFunction
): Promise<ethers.BigNumber> => {
  const l1Alerts = await getAlertsFunc({
    botIds: [""],
    alertId: "L1-DAI-LOCKED-CHANGE",
    chainId: 1,
  });
  const metadata = l1Alerts.alerts[0].metadata;
  const l1DaiLockedString = l2ChainId === 10 ? metadata.l1OptEscrowBalance : metadata.l1ArbEscrowBalance;
  return ethers.BigNumber.from(l1DaiLockedString);
};

export const getL2DaiSupply = async (blNumber: number, provider: Provider): Promise<ethers.BigNumber> => {
  const l2DaiContract = new ethers.Contract(L2_DAI_TOKEN_ADDRESS, L2_TOKEN_ABI, provider);
  const l2DaiSupply = await l2DaiContract.totalSupply({ blockTag: blNumber });
  const l2BigNumber = ethers.BigNumber.from(l2DaiSupply);
  return l2BigNumber;
};

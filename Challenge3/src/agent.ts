import { Finding, FindingSeverity, FindingType, HandleBlock, BlockEvent, getEthersProvider, ethers } from "forta-agent";
import { L1_DAI_TOKEN_ADDRESS, L1_ESCROW_ABI, L1_ARB_ESCROW_ADDRESS, L1_OPT_ESCROW_ADDRESS } from "./constants";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { l1Finding } from "./utils";

let chainId: number;
let l1OptEscrowBalance: number;
let l1ArbEscrowBalance: number;

export function provideInitialize(provider: ethers.providers.Provider) {
  return async function initialize() {
    const network = await provider.getNetwork();
    chainId = network.chainId;
  };
}

export function provideHandleBlock(provider: ethers.providers.Provider): HandleBlock {
  return async (blEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (chainId === 1) {
      const l1DaiContract = new Contract(L1_DAI_TOKEN_ADDRESS, L1_ESCROW_ABI, provider);
      const newL1OptEscrowBalance = await l1DaiContract.balanceOf(L1_OPT_ESCROW_ADDRESS, {
        blockTag: blEvent.blockNumber,
      });
      const newL1ArbEscrowBalance = await l1DaiContract.balanceOf(L1_ARB_ESCROW_ADDRESS, {
        blockTag: blEvent.blockNumber,
      });
      if (newL1OptEscrowBalance !== l1OptEscrowBalance || newL1ArbEscrowBalance !== l1ArbEscrowBalance) {
        l1OptEscrowBalance = newL1OptEscrowBalance;
        l1ArbEscrowBalance = newL1ArbEscrowBalance;
        findings.push(l1Finding(l1OptEscrowBalance.toString(), l1ArbEscrowBalance.toString()));
      }
      // USE ALERTS...     l2Alerts.alerts[0].metadata[isOptEscrow ? "optEscBal" : "abtEscBal"] = balance;
    } else {
    }
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(getEthersProvider()),
};

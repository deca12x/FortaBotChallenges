import { Finding, HandleBlock, BlockEvent, getEthersProvider, ethers } from "forta-agent";
import { L1_DAI_TOKEN_ADDRESS, L1_ESCROW_ABI, L1_ARB_ESCROW_ADDRESS, L1_OPT_ESCROW_ADDRESS } from "./constants";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { l1Finding, getL1DaiLocked, getL2DaiSupply, emitL1Alert, l2Finding } from "./utils";

let chainId: number;
let l1OptEscrowBalance: ethers.BigNumber = ethers.BigNumber.from(0);
let l1ArbEscrowBalance: ethers.BigNumber = ethers.BigNumber.from(0);
let newL1OptEscrowBalance: ethers.BigNumber;
let newL1ArbEscrowBalance: ethers.BigNumber;
let l1DaiLocked: ethers.BigNumber;
let l2DaiSupply: ethers.BigNumber;

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
      newL1OptEscrowBalance = await l1DaiContract.balanceOf(L1_OPT_ESCROW_ADDRESS, {
        blockTag: blEvent.blockNumber,
      });
      newL1ArbEscrowBalance = await l1DaiContract.balanceOf(L1_ARB_ESCROW_ADDRESS, {
        blockTag: blEvent.blockNumber,
      });

      if (!newL1OptEscrowBalance.eq(l1OptEscrowBalance) || !newL1ArbEscrowBalance.eq(l1ArbEscrowBalance)) {
        l1OptEscrowBalance = newL1OptEscrowBalance;
        l1ArbEscrowBalance = newL1ArbEscrowBalance;
        findings.push(l1Finding(l1OptEscrowBalance.toString(), l1ArbEscrowBalance.toString()));
        emitL1Alert(l1OptEscrowBalance.toString(), l1ArbEscrowBalance.toString());
      }
    } else {
      l1DaiLocked = await getL1DaiLocked(chainId);
      l2DaiSupply = await getL2DaiSupply(blEvent.blockNumber, provider);
      if (l1DaiLocked.gt(l2DaiSupply)) {
        l2Finding(l1DaiLocked.toString(), l2DaiSupply.toString(), chainId);
      }
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(getEthersProvider()),
};

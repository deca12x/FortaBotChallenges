import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
  ethers,
} from "forta-agent";
import { Provider } from "@ethersproject/providers";
import { UNI_SWAP_EVENT_ABI, UNI_POOL_FUNCTIONS_ABI, UNI_FACTORY_ADDRESS, UNI_INIT_CODE_HASH } from "./constants";

export function provideHandleTransaction(
  uniFactoryAddress: string,
  uniInitCode: string,
  uniSwapEventAbi: string,
  provider: Provider
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    // todo: if none of txEvent.addresses match the pool addresses in the LRU cache, return

    const filteredLogs = txEvent.filterLog(uniSwapEventAbi);

    for (const filteredLog of filteredLogs) {
      const interceptedPoolAddress = filteredLog.address;
      const interceptedPoolContract = new ethers.Contract(interceptedPoolAddress, uniSwapEventAbi, provider);
      const interceptedPoolValues: any[] = await Promise.all([
        interceptedPoolContract.token0({ blockTag: txEvent.blockNumber }),
        interceptedPoolContract.token1({ blockTag: txEvent.blockNumber }),
        interceptedPoolContract.fee({ blockTag: txEvent.blockNumber }),
      ]);
      const interceptedPoolValuesBytes = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint24"],
        interceptedPoolValues
      );
      const interceptedSalt = ethers.utils.solidityKeccak256(["bytes"], [interceptedPoolValuesBytes]);
      const realPoolAddress = ethers.utils.getCreate2Address(uniFactoryAddress, interceptedSalt, uniInitCode);
      const isUniPool = realPoolAddress.toLowerCase() === interceptedPoolAddress.toLowerCase();
      if (!isUniPool) return findings;

      // findings.push(
      //   Finding.fromObject({
      //     name: isDeployment ? "Nethermind Bot Deployment" : "Nethermind Bot Update",
      //     description: `Nethermind ${
      //       isDeployment ? "deployed a new" : "updated an existing"
      //     } bot with ID: ${event.args.agentId?.toString()}`,
      //     alertId: isDeployment ? "NEW-BOT-DEPLOYED" : "EXISTING-BOT-UPDATED",
      //     severity: FindingSeverity.Low,
      //     type: FindingType.Info,
      //     metadata: {
      //       agentId: event.args.agentId?.toString(),
      //       chainId: "137",
      //     },
      //   })
      // );
    }

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(UNI_FACTORY_ADDRESS, UNI_SWAP_EVENT_ABI, getEthersProvider()),
};

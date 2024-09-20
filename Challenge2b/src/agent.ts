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
import {
  UNI_SWAP_EVENT_ABI,
  UNI_POOL_FUNCTIONS_ABI,
  UNI_FACTORY_ADDRESS,
  UNI_INIT_CODE_HASH,
  CHAIN_IDS,
} from "./constants";

// export function provideHandleTransaction(): HandleTransaction {
//   return async (txEvent: TransactionEvent) => {
//     console.log("0000000000");
//     const findings: Finding[] = [];
//     return findings;
//   };
// }

// export default { handleTransaction: provideHandleTransaction() };

export function provideHandleTransaction(
  uniFactoryAddress: string,
  uniInitCode: string,
  uniSwapEventAbi: string,
  uniPoolFunctionsAbi: string[],
  provider: Provider,
  chainId: string
): HandleTransaction {
  console.log("provideHandleTransaction");
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    // todo: if none of txEvent.addresses match the pool addresses in the LRU cache, return

    const filteredLogs = txEvent.filterLog(uniSwapEventAbi);
    console.log(filteredLogs);

    for (const filteredLog of filteredLogs) {
      const { sender, recipient, amount0, amount1 } = filteredLog.args;
      const interceptedPoolContract = new ethers.Contract(
        recipient,
        uniPoolFunctionsAbi,
        provider
      );
      const interceptedPoolValues: any[] = await Promise.all([
        interceptedPoolContract.token0({ blockTag: txEvent.blockNumber }),
        interceptedPoolContract.token1({ blockTag: txEvent.blockNumber }),
        interceptedPoolContract.fee({ blockTag: txEvent.blockNumber }),
      ]);
      const interceptedPoolValuesBytes = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint24"],
        interceptedPoolValues
      );
      const interceptedSalt = ethers.utils.solidityKeccak256(
        ["bytes"],
        [interceptedPoolValuesBytes]
      );
      const realPoolAddress = ethers.utils.getCreate2Address(
        uniFactoryAddress,
        interceptedSalt,
        uniInitCode
      );
      const isRealPool =
        realPoolAddress.toLowerCase() === recipient.toLowerCase();
      if (!isRealPool) return findings;

      findings.push(
        Finding.fromObject({
          name: "Uniswap V3 Swap Detected",
          description: `Address: ${sender} swapped ${amount0} ${interceptedPoolValues[0]} for ${amount1} ${interceptedPoolValues[1]}, using pool: ${realPoolAddress}`,
          alertId: "UNISWAPV3-SWAP-DETECTED",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            agentId: filteredLog.args.agentId?.toString(),
            chainId,
            poolAddress: realPoolAddress.toLowerCase(),
            sender,
            recipient,
            amount0: amount0.toString(),
            amount1: amount1.toString(),
          },
        })
      );
    }

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    UNI_FACTORY_ADDRESS,
    UNI_INIT_CODE_HASH,
    UNI_SWAP_EVENT_ABI,
    UNI_POOL_FUNCTIONS_ABI,
    getEthersProvider(),
    CHAIN_IDS[0].toString()
  ),
};

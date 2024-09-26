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
// import { LRUCache } from "lru-cache";
import {
  UNI_SWAP_EVENT_ABI,
  UNI_POOL_FUNCTIONS_ABI,
  UNI_FACTORY_ADDRESS,
  UNI_INIT_CODE_HASH,
  CHAIN_IDS,
} from "./constants";

// const addressIsUniCache = new LRUCache<string, boolean>({ max: 10000 });

const getPoolValues = async (
  provider: Provider,
  uniPoolFunctionsAbi: string[],
  interceptedPoolAddress: string,
  txEvent: TransactionEvent
) => {
  const interceptedPoolContract = new ethers.Contract(
    interceptedPoolAddress,
    uniPoolFunctionsAbi,
    provider
  );
  const interceptedPoolValues: any[] = await Promise.all([
    interceptedPoolContract.token0({ blockTag: txEvent.blockNumber }),
    interceptedPoolContract.token1({ blockTag: txEvent.blockNumber }),
    interceptedPoolContract.fee({ blockTag: txEvent.blockNumber }),
  ]);
  return interceptedPoolValues;
};

const isRealPool = async (
  uniFactoryAddress: string,
  uniInitCode: string,
  interceptedPoolAddress: string,
  interceptedPoolValues: any[]
) => {
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
    realPoolAddress.toLowerCase() === interceptedPoolAddress.toLowerCase();
  return isRealPool;
};

export function provideHandleTransaction(
  uniFactoryAddress: string,
  uniInitCode: string,
  uniSwapEventAbi: string,
  uniPoolFunctionsAbi: string[],
  provider: Provider,
  chainId: string
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    // todo: if none of txEvent.addresses match the pool addresses in the LRU cache, return

    const filteredLogs = txEvent.filterLog(uniSwapEventAbi);

    for (const filteredLog of filteredLogs) {
      const interceptedPoolAddress = filteredLog.address;
      // const isPoolInCache = addressIsUniCache.get(interceptedPoolAddress);

      // if (isPoolInCache === false) return findings;

      const interceptedPoolValues = await getPoolValues(
        provider,
        uniPoolFunctionsAbi,
        interceptedPoolAddress,
        txEvent
      );

      const isRealPoolBool: boolean = await isRealPool(
        uniFactoryAddress,
        uniInitCode,
        interceptedPoolAddress,
        interceptedPoolValues
      );

      // addressIsUniCache.set(interceptedPoolAddress, isRealPool);

      if (!isRealPoolBool) return findings;

      const { sender, amount0, amount1, agentId } = filteredLog.args;

      findings.push(
        Finding.fromObject({
          name: "Uniswap V3 Swap Detected",
          description: `Address: ${sender} swapped ${amount0} ${interceptedPoolValues[0]} for ${amount1} ${interceptedPoolValues[1]}, using pool: ${interceptedPoolAddress}`,
          alertId: "UNISWAPV3-SWAP-DETECTED",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            agentId: agentId?.toString(),
            chainId,
            poolAddress: interceptedPoolAddress.toLowerCase(),
            sender,
            interceptedPoolAddress,
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

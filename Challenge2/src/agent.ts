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
import { LRUCache } from "lru-cache";
import { UNI_SWAP_EVENT_ABI, UNI_POOL_FUNCTIONS_ABI, UNI_FACTORY_ADDRESS, UNI_INIT_CODE_HASH } from "./constants";
import { PoolValues } from "./types";
import { getPoolValues, getUniV3PoolAddress } from "./utils";

const addressIsUniCache = new LRUCache<string, boolean>({ max: 100000 });

export function provideHandleTransaction(
  uniFactoryAddress: string,
  uniInitCode: string,
  uniSwapEventAbi: string,
  uniPoolFunctionsAbi: string[],
  provider: Provider
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const filteredLogs = txEvent.filterLog(uniSwapEventAbi);

    for (const filteredLog of filteredLogs) {
      const interceptedPoolAddress = filteredLog.address;
      const isPoolInCache = addressIsUniCache.get(interceptedPoolAddress);

      if (isPoolInCache === false) return findings; // if was in cache and not a real pool, return

      const interceptedPoolValues: PoolValues = await getPoolValues(
        provider,
        uniPoolFunctionsAbi,
        interceptedPoolAddress,
        txEvent
      );

      if (isPoolInCache === undefined) {
        // if wan't in cache, check if it's a real pool
        const uniV3PoolAddress: string = getUniV3PoolAddress(uniFactoryAddress, uniInitCode, interceptedPoolValues);
        const isUniV3Pool = uniV3PoolAddress.toLowerCase() === interceptedPoolAddress.toLowerCase();
        addressIsUniCache.set(interceptedPoolAddress, isUniV3Pool); // now it's in cache
        if (!isUniV3Pool) return findings; // if not a real pool, return
      }

      // remaining scenarios are: pool was in cache and is a real pool, or wan't in cache (but now it is) and is a real pool

      const { sender, amount0, amount1 } = filteredLog.args;

      findings.push(
        Finding.fromObject({
          name: "Uniswap V3 Swap Detected",
          description: `Address ${sender} swapped ${Math.abs(amount0)} of token ${interceptedPoolValues.token0} for ${amount1} of token ${interceptedPoolValues.token1}, using pool ${interceptedPoolAddress}`,
          alertId: "UNISWAPV3-SWAP-DETECTED",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
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
    getEthersProvider()
  ),
};

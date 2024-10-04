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

const addressIsUniCache = new LRUCache<string, boolean>({ max: 100000 });

interface PoolValues {
  token0: string;
  token1: string;
  fee: number;
}

const getPoolValues = async (
  provider: Provider,
  uniPoolFunctionsAbi: string[],
  poolAddress: string,
  txEvent: TransactionEvent
) => {
  const poolContract = new ethers.Contract(poolAddress, uniPoolFunctionsAbi, provider);
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0({ blockTag: txEvent.blockNumber }),
    poolContract.token1({ blockTag: txEvent.blockNumber }),
    poolContract.fee({ blockTag: txEvent.blockNumber }),
  ]);
  return { token0, token1, fee };
};

export const getRealPoolAddress = (uniFactoryAddress: string, uniInitCode: string, interceptedPoolValues: any[]) => {
  const interceptedPoolValuesBytes = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint24"],
    interceptedPoolValues
  );
  const interceptedSalt = ethers.utils.solidityKeccak256(["bytes"], [interceptedPoolValuesBytes]);
  const realPoolAddress = ethers.utils.getCreate2Address(uniFactoryAddress, interceptedSalt, uniInitCode);
  return realPoolAddress;
};

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
        const realPoolAddress: string = await getRealPoolAddress(uniFactoryAddress, uniInitCode, [
          interceptedPoolValues.token0,
          interceptedPoolValues.token1,
          interceptedPoolValues.fee,
        ]);
        const isRealPool = realPoolAddress.toLowerCase() === interceptedPoolAddress.toLowerCase();
        addressIsUniCache.set(interceptedPoolAddress, isRealPool); // now it's in cache
        if (!isRealPool) return findings; // if not a real pool, return
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

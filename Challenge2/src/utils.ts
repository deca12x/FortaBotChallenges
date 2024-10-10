import { TransactionEvent, ethers } from "forta-agent";
import { Provider } from "@ethersproject/providers";
import { PoolValues } from "./types";

export const getPoolValues = async (
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

export const getUniV3PoolAddress = (
  uniFactoryAddress: string,
  uniInitCode: string,
  interceptedPoolValues: PoolValues
) => {
  const interceptedPoolValuesBytes = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "uint24"],
    [interceptedPoolValues.token0, interceptedPoolValues.token1, interceptedPoolValues.fee]
  );
  const interceptedSalt = ethers.utils.solidityKeccak256(["bytes"], [interceptedPoolValuesBytes]);
  const uniV3PoolAddress = ethers.utils.getCreate2Address(uniFactoryAddress, interceptedSalt, uniInitCode);
  return uniV3PoolAddress;
};

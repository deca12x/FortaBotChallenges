export const CREATE_AGENT_ABI = "function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds)";
export const UPDATE_AGENT_ABI = "function updateAgent(uint256 agentId,string metadata,uint256[] chainIds)";

export const NETHERMIND_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
export const FORTA_REGISTRY_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

export const MOCK_CHAIN_IDS = [137];
export const MOCK_AGENT_ID = 1;

export const SWAP_ABI =
  "event Swap (address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
export const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const UNI_INIT_CODE_HASH = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
export const UNI_POOL_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
];

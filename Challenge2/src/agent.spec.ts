import { Finding, FindingSeverity, FindingType, HandleTransaction, ethers } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";
import { UNI_SWAP_EVENT_ABI, UNI_POOL_FUNCTIONS_ABI } from "./constants";
import { PoolValues, getRealPoolAddress } from "./agent";

const mockUniFactoryAddress = createAddress("0x01");
const mockInitCodeHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
const mockSender = createAddress("0x03");
const mockToken0 = createAddress("0x04");
const mockToken1 = createAddress("0x05");
const mockFee = 2;
const mockOtherAddress = createAddress("0x06");
const mockPoolValues: PoolValues = { token0: mockToken0, token1: mockToken1, fee: mockFee };
let mockRealPoolAddress: string;
let mockSwapEventArgs: SwapEventArgs;

interface SwapEventArgs {
  sender: string;
  poolAddress: string;
  amount0: ethers.BigNumber;
  amount1: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  liquidity: ethers.BigNumber;
  tick: number;
}

let mockProvider = new MockEthersProvider();
const provider = mockProvider as unknown as ethers.providers.Provider;
let uniPoolFunctionsInterface = new ethers.utils.Interface(UNI_POOL_FUNCTIONS_ABI);

const handleTransaction: HandleTransaction = provideHandleTransaction(
  mockUniFactoryAddress,
  mockInitCodeHash,
  UNI_SWAP_EVENT_ABI,
  UNI_POOL_FUNCTIONS_ABI,
  provider
);

// We're not really configuring the provider, we're configuring the state of the mock chain and the calls that are available to our contract
const configMockProvider = (poolAddress: string) => {
  mockProvider.addCallTo(poolAddress, 0, uniPoolFunctionsInterface, "token0", {
    inputs: [],
    outputs: [mockToken0],
  });
  mockProvider.addCallTo(poolAddress, 0, uniPoolFunctionsInterface, "token1", {
    inputs: [],
    outputs: [mockToken1],
  });
  mockProvider.addCallTo(poolAddress, 0, uniPoolFunctionsInterface, "fee", {
    inputs: [],
    outputs: [mockFee],
  });
  mockProvider.setLatestBlock(0);
};

describe("Uni V3 Swap Detector Test Suite", () => {
  beforeAll(async () => {
    mockRealPoolAddress = (
      await getRealPoolAddress(mockUniFactoryAddress, mockInitCodeHash, mockPoolValues)
    ).toLowerCase();
    mockSwapEventArgs = {
      sender: mockSender,
      poolAddress: mockRealPoolAddress,
      amount0: ethers.BigNumber.from("-1000000000000000000"),
      amount1: ethers.BigNumber.from("3000000000000000000000"),
      sqrtPriceX96: ethers.BigNumber.from("39614081257132168796771975168"),
      liquidity: ethers.BigNumber.from("1000000000000000000000000"),
      tick: 40943,
    };
  });

  let mockTxEvent: TestTransactionEvent;
  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent().setBlock(0);
  });

  it("ignores transactions that don't emit a Swap Event and are not to an official Uni V3 Pool", async () => {
    configMockProvider(mockOtherAddress);
    mockTxEvent.setTo(mockOtherAddress);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("ignores transactions that emit a Swap Event but are not to an official Uni V3 Pool", async () => {
    configMockProvider(mockOtherAddress);
    mockTxEvent
      .setTo(mockOtherAddress)
      .addEventLog(UNI_SWAP_EVENT_ABI, mockOtherAddress, Object.values(mockSwapEventArgs));
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("ignores transactions that are to an official Uni V3 Pool but don't emit a Swap Event", async () => {
    configMockProvider(mockRealPoolAddress);
    configMockProvider(mockOtherAddress);
    mockTxEvent
      .setTo(mockRealPoolAddress)
      .addEventLog(UNI_SWAP_EVENT_ABI, mockOtherAddress, Object.values(mockSwapEventArgs));
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("successfully detects an official swap, returning 1 finding", async () => {
    configMockProvider(mockRealPoolAddress); // real
    configMockProvider(mockOtherAddress); // other real function calls but not to offical Uni V3 Pool

    mockTxEvent // intercepted
      .setTo(mockRealPoolAddress)
      .addEventLog(UNI_SWAP_EVENT_ABI, mockRealPoolAddress, Object.values(mockSwapEventArgs))
      .addEventLog(UNI_SWAP_EVENT_ABI, mockOtherAddress, Object.values(mockSwapEventArgs));

    const findings = await handleTransaction(mockTxEvent);
    expect(findings.length).toStrictEqual(1);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Uniswap V3 Swap Detected",
        description: `Address ${mockSender} swapped ${Math.abs(Number(mockSwapEventArgs.amount0))} of token ${mockToken0} for ${mockSwapEventArgs.amount1} of token ${mockToken1}, using pool ${mockRealPoolAddress}`,
        alertId: "UNISWAPV3-SWAP-DETECTED",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          poolAddress: mockRealPoolAddress.toLowerCase(),
          sender: mockSender,
          interceptedPoolAddress: mockRealPoolAddress.toLowerCase(),
          amount0: mockSwapEventArgs.amount0.toString(),
          amount1: mockSwapEventArgs.amount1.toString(),
        },
      }),
    ]);
  });

  it("successfully detects multiple swaps in a txEvent, returning multiple findings", async () => {
    configMockProvider(mockRealPoolAddress);
    configMockProvider(mockOtherAddress);

    mockTxEvent
      .setTo(mockRealPoolAddress)
      .addEventLog(UNI_SWAP_EVENT_ABI, mockRealPoolAddress, Object.values(mockSwapEventArgs))
      .addEventLog(UNI_SWAP_EVENT_ABI, mockRealPoolAddress, Object.values(mockSwapEventArgs))
      .addEventLog(UNI_SWAP_EVENT_ABI, mockOtherAddress, Object.values(mockSwapEventArgs));
    const findings = await handleTransaction(mockTxEvent);
    expect(findings.length).toStrictEqual(2);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Uniswap V3 Swap Detected",
        description: `Address ${mockSender} swapped ${Math.abs(Number(mockSwapEventArgs.amount0))} of token ${mockToken0} for ${mockSwapEventArgs.amount1} of token ${mockToken1}, using pool ${mockRealPoolAddress}`,
        alertId: "UNISWAPV3-SWAP-DETECTED",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          poolAddress: mockRealPoolAddress.toLowerCase(),
          sender: mockSender,
          interceptedPoolAddress: mockRealPoolAddress.toLowerCase(),
          amount0: mockSwapEventArgs.amount0.toString(),
          amount1: mockSwapEventArgs.amount1.toString(),
        },
      }),
      Finding.fromObject({
        name: "Uniswap V3 Swap Detected",
        description: `Address ${mockSender} swapped ${Math.abs(Number(mockSwapEventArgs.amount0))} of token ${mockToken0} for ${mockSwapEventArgs.amount1} of token ${mockToken1}, using pool ${mockRealPoolAddress}`,
        alertId: "UNISWAPV3-SWAP-DETECTED",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          poolAddress: mockRealPoolAddress.toLowerCase(),
          sender: mockSender,
          interceptedPoolAddress: mockRealPoolAddress.toLowerCase(),
          amount0: mockSwapEventArgs.amount0.toString(),
          amount1: mockSwapEventArgs.amount1.toString(),
        },
      }),
    ]);
  });
});

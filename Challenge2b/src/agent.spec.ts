import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  ethers,
} from "forta-agent";
import { createAddress } from "forta-agent-tools";
import {
  TestTransactionEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";
import { UNI_SWAP_EVENT_ABI, UNI_POOL_FUNCTIONS_ABI } from "./constants";
import { isRealPool } from "./agent";

const mockFactoryAddress = createAddress("0x01");
const mockInitCodeHash = "0x02";
const mockToken0 = createAddress("0x03");
const mockToken1 = createAddress("0x04");
const mockFee = 2;
const mockPoolValues = [mockToken0, mockToken1, mockFee];

let mockProvider = new MockEthersProvider();
const provider = mockProvider as unknown as ethers.providers.Provider;

const handleTransaction: HandleTransaction = provideHandleTransaction(
  mockFactoryAddress,
  mockInitCodeHash,
  UNI_SWAP_EVENT_ABI,
  UNI_POOL_FUNCTIONS_ABI,
  provider
);

const getMockPoolValues = (contractAddress: string) => {
  mockProvider.addCallTo(contractAddress, 0, Iface, "token0", {
    inputs: [],
    outputs: [mockToken0],
  });
  mockProvider.addCallTo(contractAddress, 0, Iface, "token1", {
    inputs: [],
    outputs: [mockToken1],
  });
  mockProvider.addCallTo(contractAddress, 0, Iface, "fee", {
    inputs: [],
    outputs: [mockFee],
  });
  mockProvider.setLatestBlock(0);
};

describe("Uni V3 Swap Detector Test Suite", () => {
  let mockTxEvent = new TestTransactionEvent();

  beforeEach(() => {});

  // const configProvider

  it("ignores transactions that don't emit a Swap Event and are not to an official Uni V3 Pool", async () => {});

  it("ignores transactions that emit a Swap Event but are not to an official Uni V3 Pool", async () => {});

  it("ignores transactions that are to an official Uni V3 Pool but don't emit a Swap Event", async () => {});

  it("successfully detects an official swap, returning 1 finding", async () => {});

  it("successfully detects multiple swaps in a txEvent, returning multiple findings", async () => {});
});

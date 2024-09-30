// import {
//   Finding,
//   FindingSeverity,
//   FindingType,
//   HandleTransaction,
//   ethers,
// } from "forta-agent";
// import { createAddress } from "forta-agent-tools";
// import {
//   TestTransactionEvent,
//   MockEthersProvider,
// } from "forta-agent-tools/lib/test";
// import { provideHandleTransaction } from "./agent";
// import {
//   UNI_SWAP_EVENT_ABI,
//   UNI_POOL_FUNCTIONS_ABI,
//   UNI_INIT_CODE_HASH,
// } from "./constants";
// import { getRealPoolAddress } from "./agent";

// const mockUniFactoryAddress = createAddress("0x01");
// const mockInitCodeHash = "0x02";
// const mockToken0 = createAddress("0x03");
// const mockToken1 = createAddress("0x04");
// const mockFee = 2;
// const mockPoolValues = [mockToken0, mockToken1, mockFee];
// // const mockUniPoolAddress =

// let mockProvider = new MockEthersProvider();
// const provider = mockProvider as unknown as ethers.providers.Provider;
// let uniPoolFunctionsInterface = new ethers.utils.Interface(
//   UNI_POOL_FUNCTIONS_ABI
// );

// const handleTransaction: HandleTransaction = provideHandleTransaction(
//   mockUniFactoryAddress,
//   mockInitCodeHash,
//   UNI_SWAP_EVENT_ABI,
//   UNI_POOL_FUNCTIONS_ABI,
//   provider
// );

// // We're not really configuring the provider, we're configuring the state of the mock chain and the calls that are available to our contract
// const configMockProvider = (contractAddress: string) => {
//   mockProvider.addCallTo(
//     contractAddress,
//     0,
//     uniPoolFunctionsInterface,
//     "token0",
//     {
//       inputs: [],
//       outputs: [mockToken0],
//     }
//   );
//   mockProvider.addCallTo(
//     contractAddress,
//     0,
//     uniPoolFunctionsInterface,
//     "token1",
//     {
//       inputs: [],
//       outputs: [mockToken1],
//     }
//   );
//   mockProvider.addCallTo(contractAddress, 0, uniPoolFunctionsInterface, "fee", {
//     inputs: [],
//     outputs: [mockFee],
//   });
//   mockProvider.setLatestBlock(0);
// };

// describe("Uni V3 Swap Detector Test Suite", () => {
//   beforeEach(() => {
//     let mockTxEvent = new TestTransactionEvent().setBlock(0);
//   });

//   it("ignores transactions that don't emit a Swap Event and are not to an official Uni V3 Pool", async () => {});

//   it("ignores transactions that emit a Swap Event but are not to an official Uni V3 Pool", async () => {});

//   it("ignores transactions that are to an official Uni V3 Pool but don't emit a Swap Event", async () => {});

//   it("successfully detects an official swap, returning 1 finding", async () => {
//     mockTxEvent.setTo();

//     // const abc = configMockProvider(mockUniPoolAddress);
//   });

//   it("successfully detects multiple swaps in a txEvent, returning multiple findings", async () => {});
// });

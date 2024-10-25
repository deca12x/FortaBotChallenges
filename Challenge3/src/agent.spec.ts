import { Finding, FindingSeverity, FindingType, HandleBlock, createBlockEvent, BlockEvent, ethers } from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { provideInitialize, provideHandleBlock } from "./agent";
import {
  L1_ARB_ESCROW_ADDRESS,
  L1_OPT_ESCROW_ADDRESS,
  L1_DAI_TOKEN_ADDRESS,
  L2_DAI_TOKEN_ADDRESS,
  L1_ESCROW_ABI,
  L2_TOKEN_ABI,
} from "./constants";
import { l1Finding, l2Finding } from "./utils";

const l1DaiLockedOpt = ethers.BigNumber.from("1000");
const l1DaiLockedArb = ethers.BigNumber.from("2000");
const newL1DaiLockedOpt = ethers.BigNumber.from("1100");
const newL1DaiLockedArb = ethers.BigNumber.from("2100");

// const MOCK_STATE_2 = {
//   l1DaiLockedOpt: ethers.BigNumber.from("1000"),
//   l2DaiSupplyOpt: ethers.BigNumber.from("1100"),
//   l1DaiLockedArb: ethers.BigNumber.from("2000"),
//   l2DaiSupplyArb: ethers.BigNumber.from("2100"),
// };

const L1_ESCROW_IFACE = new ethers.utils.Interface(L1_ESCROW_ABI);
const L2_TOKEN_IFACE = new ethers.utils.Interface(L2_TOKEN_ABI);

describe("MakerDAO Bridge Invariant Bot Test Suite", () => {
  let mockProvider: MockEthersProvider;
  let provider: ethers.providers.Provider;
  let initialize: any;
  let handleBlock: HandleBlock;

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
    initialize = provideInitialize(mockProvider as unknown as ethers.providers.Provider);
    handleBlock = provideHandleBlock(provider);
  });

  it("should return a finding when L1 escrow balances change", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0x1", number: 1 } as any,
    });
    mockProvider.setNetwork(1);
    await initialize();

    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_OPT_ESCROW_ADDRESS],
      outputs: [l1DaiLockedOpt],
    });
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_ARB_ESCROW_ADDRESS],
      outputs: [l1DaiLockedOpt],
    });

    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_OPT_ESCROW_ADDRESS],
      outputs: [newL1DaiLockedOpt],
    });
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_ARB_ESCROW_ADDRESS],
      outputs: [newL1DaiLockedArb],
    });

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([l1Finding(newL1DaiLockedOpt.toString(), newL1DaiLockedArb.toString())]);
  });

  // it("should not return a finding when L1 escrow balances do not change", async () => {
  //   const blockEvent = createBlockEvent({
  //     block: { hash: "0x1", number: 1 } as any,
  //   });
  //   mockProvider.setNetwork(1);
  //   await initialize();

  //   mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
  //     inputs: [L1_OPT_ESCROW_ADDRESS],
  //     outputs: [MOCK_L1_STATES.l1DaiLockedOpt],
  //   });
  //   mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
  //     inputs: [L1_ARB_ESCROW_ADDRESS],
  //     outputs: [MOCK_L1_STATES.l1DaiLockedArb],
  //   });

  //   mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
  //     inputs: [L1_OPT_ESCROW_ADDRESS],
  //     outputs: [MOCK_L1_STATES.l1DaiLockedOpt],
  //   });
  //   mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
  //     inputs: [L1_ARB_ESCROW_ADDRESS],
  //     outputs: [MOCK_L1_STATES.l1DaiLockedArb],
  //   });

  //   const findings = await handleBlock(blockEvent);
  //   expect(findings).toStrictEqual([]); // Expect no findings since balances did not change
  // });

  // it("should return a finding when L1 DAI locked is greater than L2 DAI supply", async () => {
  //   // Mock the L2 DAI supply
  //   mockProvider.addCallTo(L2_DAI_TOKEN_ADDRESS, 0, new ethers.utils.Interface(L2_TOKEN_ABI), "totalSupply", {
  //     inputs: [],
  //     outputs: [ethers.BigNumber.from("500")],
  //   });

  //   const findings = await handleBlock(mockBlockEvent);
  //   expect(findings).toStrictEqual([
  //     l2Finding("1000", "500", 10), // Assuming chainId 10 for Optimism
  //   ]);
  // });

  // it("should not return any findings if conditions are not met", async () => {
  //   // Mock the L1 DAI contract calls with no changes
  //   mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 0, new ethers.utils.Interface(L1_ESCROW_ABI), "balanceOf", {
  //     inputs: [L1_OPT_ESCROW_ADDRESS],
  //     outputs: [ethers.BigNumber.from("1000")],
  //   });
  //   mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 0, new ethers.utils.Interface(L1_ESCROW_ABI), "balanceOf", {
  //     inputs: [L1_ARB_ESCROW_ADDRESS],
  //     outputs: [ethers.BigNumber.from("2000")],
  //   });

  //   // Mock the L2 DAI supply with no breach
  //   mockProvider.addCallTo(L2_DAI_TOKEN_ADDRESS, 0, new ethers.utils.Interface(L2_TOKEN_ABI), "totalSupply", {
  //     inputs: [],
  //     outputs: [ethers.BigNumber.from("3000")],
  //   });

  //   const findings = await handleBlock(mockBlockEvent);
  //   expect(findings).toStrictEqual([]);
  // });
});

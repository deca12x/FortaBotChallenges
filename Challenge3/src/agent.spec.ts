import { HandleBlock, createBlockEvent, AlertsResponse, ethers } from "forta-agent";
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
import { l1Finding, l2Finding } from "./findings";

const l1DaiLockedOpt = ethers.BigNumber.from("1000");
const l1DaiLockedArb = ethers.BigNumber.from("2000");
const newL1DaiLockedOpt = ethers.BigNumber.from("1100");
const newL1DaiLockedArb = ethers.BigNumber.from("2100");

const l2DaiSupplyOpt = ethers.BigNumber.from("1000");
const l2DaiSupplyArb = ethers.BigNumber.from("2000");
const higherL2DaiSupplyOpt = ethers.BigNumber.from("1500");
const higherL2DaiSupplyArb = ethers.BigNumber.from("2500");

const L1_ESCROW_IFACE = new ethers.utils.Interface(L1_ESCROW_ABI);
const L2_TOKEN_IFACE = new ethers.utils.Interface(L2_TOKEN_ABI);

const getMockL1Alerts = async (options: {
  botIds: string[];
  alertId?: string;
  chainId?: number;
}): Promise<AlertsResponse> => {
  return {
    alerts: [
      {
        alertId: "L1-DAI-LOCKED-CHANGE",
        hasAddress: () => false,
        metadata: {
          l1OptEscrowBalance: "1000",
          l1ArbEscrowBalance: "2000",
        },
      },
    ],
    pageInfo: { hasNextPage: false },
  };
};

describe("MakerDAO Bridge Invariant Bot Test Suite", () => {
  let mockProvider: MockEthersProvider;
  let provider: ethers.providers.Provider;
  let initialize: any;
  let handleBlock: HandleBlock;

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
    initialize = provideInitialize(mockProvider as unknown as ethers.providers.Provider);
    handleBlock = provideHandleBlock(provider, getMockL1Alerts);
  });

  it("should return a finding only when L1 escrow balances change", async () => {
    mockProvider.setNetwork(1);
    await initialize();

    // First block event - should produce findings
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_OPT_ESCROW_ADDRESS],
      outputs: [l1DaiLockedOpt],
    });
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 1, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_ARB_ESCROW_ADDRESS],
      outputs: [l1DaiLockedArb],
    });
    const blockEvent1 = createBlockEvent({ block: { hash: "0x1", number: 1 } as any });
    const findings1 = await handleBlock(blockEvent1);
    expect(findings1).toStrictEqual([l1Finding(l1DaiLockedOpt.toString(), l1DaiLockedArb.toString())]);

    // Second block event - should not produce findings (no change)
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 2, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_OPT_ESCROW_ADDRESS],
      outputs: [l1DaiLockedOpt],
    });
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 2, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_ARB_ESCROW_ADDRESS],
      outputs: [l1DaiLockedArb],
    });
    const blockEvent2 = createBlockEvent({ block: { hash: "0x2", number: 2 } as any });
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([]);

    // Third block event - should produce findings (change)
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 3, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_OPT_ESCROW_ADDRESS],
      outputs: [newL1DaiLockedOpt],
    });
    mockProvider.addCallTo(L1_DAI_TOKEN_ADDRESS, 3, L1_ESCROW_IFACE, "balanceOf", {
      inputs: [L1_ARB_ESCROW_ADDRESS],
      outputs: [newL1DaiLockedArb],
    });
    const blockEvent3 = createBlockEvent({ block: { hash: "0x3", number: 3 } as any });
    const findings3 = await handleBlock(blockEvent3);
    expect(findings3).toStrictEqual([l1Finding(newL1DaiLockedOpt.toString(), newL1DaiLockedArb.toString())]);
  });

  it("should return a finding when L2 DAI supply on Optimism is greater than L1 DAI locked", async () => {
    mockProvider.setNetwork(10);
    await initialize();

    // First block event - should not produce findings
    mockProvider.addCallTo(L2_DAI_TOKEN_ADDRESS, 1, L2_TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: [l2DaiSupplyOpt],
    });
    const blockEvent1 = createBlockEvent({ block: { hash: "0x1", number: 1 } as any });
    const findings1 = await handleBlock(blockEvent1);
    expect(findings1).toStrictEqual([]);

    // Second block event - should produce findings
    mockProvider.addCallTo(L2_DAI_TOKEN_ADDRESS, 2, L2_TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: [higherL2DaiSupplyOpt],
    });
    const blockEvent2 = createBlockEvent({ block: { hash: "0x2", number: 2 } as any });
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([l2Finding(l1DaiLockedOpt.toString(), higherL2DaiSupplyOpt.toString(), 10)]);
  });

  it("should return a finding when L2 DAI supply on Arbitrum is greater than L1 DAI locked", async () => {
    mockProvider.setNetwork(42161);
    await initialize();

    // First block event - should not produce findings
    mockProvider.addCallTo(L2_DAI_TOKEN_ADDRESS, 1, L2_TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: [l2DaiSupplyArb],
    });
    const blockEvent1 = createBlockEvent({ block: { hash: "0x1", number: 1 } as any });
    const findings1 = await handleBlock(blockEvent1);
    expect(findings1).toStrictEqual([]);

    // Second block event - should produce findings
    mockProvider.addCallTo(L2_DAI_TOKEN_ADDRESS, 2, L2_TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: [higherL2DaiSupplyArb],
    });
    const blockEvent2 = createBlockEvent({ block: { hash: "0x2", number: 2 } as any });
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([l2Finding(l1DaiLockedArb.toString(), higherL2DaiSupplyArb.toString(), 42161)]);
  });
});

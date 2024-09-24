import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, ethers } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";

const mockNethermindAddress = createAddress("0x01");
const mockFortaRegistryAddress = createAddress("0x02");
const mockOtherAddress = createAddress("0x03");

const mockAgentId = 1;
const mockChainIds = [137];
const mockCreateAgentAbi = "function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds)";
const mockUpdateAgentAbi = "function updateAgent(uint256 agentId,string metadata,uint256[] chainIds)";
const otherFunctionAbi = "function isRegistered(uint256 agentId)";

const ifaceForSetData = new ethers.utils.Interface([mockCreateAgentAbi, mockUpdateAgentAbi, otherFunctionAbi]);
const encodedCreateAgentData = ifaceForSetData.encodeFunctionData("createAgent", [
  mockAgentId,
  mockNethermindAddress,
  "metadata",
  mockChainIds,
]);
const encodedUpdateAgentData = ifaceForSetData.encodeFunctionData("updateAgent", [
  mockAgentId,
  "metadata",
  mockChainIds,
]);
const encodedOtherFunctionData = ifaceForSetData.encodeFunctionData("isRegistered", [mockAgentId]);

describe("Nethermind Bot Creation and Update Detection Bot Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent = new TestTransactionEvent();
  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      mockCreateAgentAbi,
      mockUpdateAgentAbi,
      mockNethermindAddress,
      mockFortaRegistryAddress,
      mockChainIds[0].toString()
    );
  });

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  it("returns empty findings if not from Nethermind address", async () => {
    mockTxEvent.setFrom(mockOtherAddress).setTo(mockFortaRegistryAddress).setData(encodedCreateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if not to Forta Registry", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockOtherAddress).setData(encodedOtherFunctionData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if neither createAgent nor updateAgent are detected", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockFortaRegistryAddress).setData(encodedOtherFunctionData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if transaction calls createAgent but in wrong contract", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockOtherAddress).setData(encodedCreateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if transaction calls updateAgent but in wrong contract", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockOtherAddress).setData(encodedUpdateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("detects bot deployment", async () => {
    mockTxEvent
      .setFrom(mockNethermindAddress)
      .setTo(mockFortaRegistryAddress)
      .addTraces({
        from: mockNethermindAddress,
        to: mockFortaRegistryAddress,
        function: mockCreateAgentAbi,
        arguments: [mockAgentId, mockNethermindAddress, "metadata", mockChainIds],
      })
      .addTraces({
        from: mockNethermindAddress,
        to: mockFortaRegistryAddress,
        function: otherFunctionAbi,
        arguments: [mockAgentId],
      });
    // .setData(encodedCreateAgentData)
    // .setBlock(60343606);
    // .setBlock(56681086);

    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(1);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Nethermind Bot Deployment",
        description: "Nethermind deployed a new bot with ID: 1",
        alertId: "NEW-BOT-DEPLOYED",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          agentId: "1",
          chainId: "137",
        },
      }),
    ]);
  });

  it("detects bot update", async () => {
    mockTxEvent
      .setFrom(mockNethermindAddress)
      .setTo(mockFortaRegistryAddress)
      .addTraces({
        from: mockNethermindAddress,
        to: mockFortaRegistryAddress,
        function: mockUpdateAgentAbi,
        arguments: [mockAgentId, "metadata", mockChainIds],
      })
      .addTraces({
        from: mockNethermindAddress,
        to: mockFortaRegistryAddress,
        function: otherFunctionAbi,
        arguments: [mockAgentId],
      });
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(1);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Nethermind Bot Update",
        description: "Nethermind updated an existing bot with ID: 1",
        alertId: "EXISTING-BOT-UPDATED",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          agentId: "1",
          chainId: "137",
        },
      }),
    ]);
  });
});

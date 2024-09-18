import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, ethers } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";
import { CREATE_AGENT_ABI, UPDATE_AGENT_ABI, OTHER_FUNCTION_ABI, MOCK_CHAIN_IDS, MOCK_AGENT_ID } from "./constants";

const mockNethermindAddress = createAddress("0x01");
const mockFortaRegistryAddress = createAddress("0x02");
const mockOtherAddress = createAddress("0x03");

const ifaceForSetData = new ethers.utils.Interface([CREATE_AGENT_ABI, UPDATE_AGENT_ABI, OTHER_FUNCTION_ABI]);
const encodedCreateAgentData = ifaceForSetData.encodeFunctionData("createAgent", [
  MOCK_AGENT_ID,
  mockNethermindAddress,
  "metadata",
  MOCK_CHAIN_IDS,
]);
const encodedUpdateAgentData = ifaceForSetData.encodeFunctionData("updateAgent", [
  MOCK_AGENT_ID,
  "metadata",
  MOCK_CHAIN_IDS,
]);
const encodedOtherFunctionData = ifaceForSetData.encodeFunctionData("isRegistered", [MOCK_AGENT_ID]);

// Second transaction for tests 6 and 7, to test if bot picks up only the relevant function
const mockTxEvent2 = new TestTransactionEvent();
mockTxEvent2.setFrom(mockNethermindAddress).setTo(mockFortaRegistryAddress).setData(encodedOtherFunctionData);

describe("Nethermind Bot Creation and Update Detection Bot Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent = new TestTransactionEvent();
  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      CREATE_AGENT_ABI,
      UPDATE_AGENT_ABI,
      mockNethermindAddress,
      mockFortaRegistryAddress
    );
  });

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  it("1. returns empty findings if not from Nethermind address", async () => {
    mockTxEvent.setFrom(mockOtherAddress).setTo(mockFortaRegistryAddress).setData(encodedCreateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("2. returns empty findings if not to Forta Registry", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockOtherAddress).setData(encodedCreateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("3. returns empty findings if neither createAgent nor updateAgent are detected", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockFortaRegistryAddress).setData(encodedOtherFunctionData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("4. returns empty findings if transaction calls createAgent but in wrong contract", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockOtherAddress).setData(encodedCreateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("5. returns empty findings if transaction calls updateAgent but in wrong contract", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockOtherAddress).setData(encodedUpdateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("6. detects bot deployment", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockFortaRegistryAddress).setData(encodedCreateAgentData);

    // .addTraces({
    //   from: mockNethermindAddress,
    //   to: mockFortaRegistryAddress,
    //   function: CREATE_AGENT_ABI,
    //   arguments: [MOCK_AGENT_ID, mockNethermindAddress, "metadata", MOCK_CHAIN_IDS],
    // });
    // .setBlock(60343606);
    // .setBlock(56681086);

    const findings = await handleTransaction(mockTxEvent);
    findings.push(...(await handleTransaction(mockTxEvent2)));
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

  it("7. detects bot update", async () => {
    mockTxEvent.setFrom(mockNethermindAddress).setTo(mockFortaRegistryAddress).setData(encodedUpdateAgentData);
    const findings = await handleTransaction(mockTxEvent);
    findings.push(...(await handleTransaction(mockTxEvent2)));
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

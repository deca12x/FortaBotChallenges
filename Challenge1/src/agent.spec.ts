import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, ethers } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";
import { CREATE_AGENT_ABI, UPDATE_AGENT_ABI, MOCK_CHAIN_IDS, MOCK_AGENT_ID } from "./constants";

const nethermindAddress = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
const fortaRegistryAddress = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

describe("Detection of bot deployments and updates, only by Nethermind, only to Forta Registry.", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent = new TestTransactionEvent();
  beforeAll(() => {
    // handleTransaction = provideHandleTransaction();
    handleTransaction = provideHandleTransaction(
      CREATE_AGENT_ABI,
      UPDATE_AGENT_ABI,
      createAddress("0x01"),
      createAddress("0x02")
    );
  });

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  it("1. returns empty findings if not from Nethermind address", async () => {
    mockTxEvent
      .setFrom(createAddress("0x0"))
      .setTo(fortaRegistryAddress)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: CREATE_AGENT_ABI,
        arguments: [MOCK_AGENT_ID, nethermindAddress, "metadata", MOCK_CHAIN_IDS],
      });
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("2. returns empty findings if not to Forta Registry", async () => {
    mockTxEvent
      .setFrom(nethermindAddress)
      .setTo(createAddress("0x0"))
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: CREATE_AGENT_ABI,
        arguments: [MOCK_AGENT_ID, nethermindAddress, "metadata", MOCK_CHAIN_IDS],
      });
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("3. returns empty findings if neither createAgent nor updateAgent are detected", async () => {
    mockTxEvent.setFrom(nethermindAddress).setTo(fortaRegistryAddress);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("4. returns empty findings if transaction calls createAgent but in wrong contract", async () => {
    mockTxEvent
      .setFrom(nethermindAddress) // Correct from address
      .setTo(createAddress("0x0")) // Incorrect to address (wrong contract)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: CREATE_AGENT_ABI,
        arguments: [MOCK_AGENT_ID, nethermindAddress, "metadata", MOCK_CHAIN_IDS],
      });
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });

  it("5. returns empty findings if transaction calls updateAgent but in wrong contract", async () => {
    mockTxEvent
      .setFrom(nethermindAddress) // Correct from address
      .setTo(createAddress("0x0")) // Incorrect to address (wrong contract)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: UPDATE_AGENT_ABI,
        arguments: [MOCK_AGENT_ID, "metadata", MOCK_CHAIN_IDS],
      });
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0); // Expecting empty findings
  });

  it("6. detects bot deployment", async () => {
    // TO DO: 1. define interface, 2. call encodeFunctionData, 3. put output in setData parameter
    // const fortaRegistryInterface = new ethers.utils.Interface();

    mockTxEvent
      .setFrom(nethermindAddress)
      .setTo(fortaRegistryAddress)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: CREATE_AGENT_ABI,
        arguments: [MOCK_AGENT_ID, nethermindAddress, "metadata", MOCK_CHAIN_IDS],
      });

    // .setData(data);
    // .setBlock(60343606);
    // .setBlock(56681086);

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        name: "Nethermind Bot Deployment",
        description: `Nethermind deployed a new bot with ID: 1`,
        alertId: "NEW-BOT-DEPLOYED",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
      } as Finding)
    );
  });

  it("7. detects bot update", async () => {
    mockTxEvent
      .setFrom(nethermindAddress)
      .setTo(fortaRegistryAddress)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: UPDATE_AGENT_ABI,
        arguments: [MOCK_AGENT_ID, "metadata", MOCK_CHAIN_IDS],
      });

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        name: "Nethermind Bot Update",
        description: `Nethermind updated an existing bot with ID: 1`,
        alertId: "EXISTING-BOT-UPDATED",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
      } as Finding)
    );
  });
});

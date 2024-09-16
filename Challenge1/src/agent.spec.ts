import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, ethers } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";

const nethermindAddress = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
const fortaRegistryAddress = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

const mockCreateAgentAbi =
  "function createAgent(uint256 agentId, address, string metadata, uint256[] chainIds) external";
const mockUpdateAgentAbi = "function updateAgent(uint256 agentId, string metadata, uint256[] chainIds) public";

// const BOT_DEPLOYMENT_FUNCTION = "function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds)";
// const BOT_UPDATE_FUNCTION = "function updateAgent(uint256 agentId,string metadata,uint256[] chainIds)";
// const NETHERMIND_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
// const FORTA_REGISTRY_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

const CHAIN_IDS = [137];
// const AGENT_ID = "0x9b0e6c00c359cdd483291914dcd27bd74bc342ec74b6f7d334e0febe7c988025";
const AGENT_ID = 1;

describe("1. returns empty findings if transaction is not from Nethermind address", () => {
  it("should return empty findings", async () => {
    const handleTransaction = provideHandleTransaction();
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0"))
      .setTo(fortaRegistryAddress);
    const findings = await handleTransaction(mockTxEvent);
    expect(findings).toHaveLength(0);
  });
});

describe("2. returns empty findings if transaction is not to Forta address", () => {
  it("should return empty findings", async () => {
    const handleTransaction = provideHandleTransaction();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(nethermindAddress)
      .setTo(createAddress("0x0"));

    // const mockTxEvent = {
    //   from: nethermindAddress,
    //   to: createAddress("0x0"),
    //   filterFunction: jest.fn().mockReturnValue([]),
    // } as unknown as TransactionEvent;

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0);
  });
});

describe("3. returns empty findings if neither createAgent nor updateAgent are detected", () => {
  it("should return empty findings", async () => {
    const handleTransaction = provideHandleTransaction();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(nethermindAddress)
      .setTo(fortaRegistryAddress);

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0);
  });
});

describe("4. returns empty findings if transaction calls createAgent but in wrong contract", () => {
  it("should return empty findings for createAgent function call", async () => {
    const handleTransaction = provideHandleTransaction();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(nethermindAddress) // Correct from address
      .setTo(createAddress("0x0")) // Incorrect to address (wrong contract)
      .addEventLog(
        "createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds)",
        createAddress("0x123"), // Wrong contract address
        [
          "0x9b0e6c00c359cdd483291914dcd27bd74bc342ec74b6f7d334e0febe7c988025", // Agent ID
          createAddress("0xabc"), // Mock owner address
          "metadata", // Mock metadata
          [1, 137], // Chain IDs
        ]
      );

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0); // Expecting empty findings
  });
});

describe("5. returns empty findings if transaction calls updateAgent but in wrong contract", () => {
  it("should return empty findings for updateAgent function call", async () => {
    const handleTransaction = provideHandleTransaction();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(nethermindAddress) // Correct from address
      .setTo(createAddress("0x0")) // Incorrect to address (wrong contract)
      .addEventLog(
        "updateAgent(uint256 agentId, address owner, string metadata)",
        createAddress("0x456"), // Wrong contract address
        [
          "456", // Agent ID for update
          createAddress("0xabc"), // Mock owner address
          "updated metadata", // Mock updated metadata
        ]
      );

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0); // Expecting empty findings
  });
});

describe("6. detects bot deployment", () => {
  it("should return a finding", async () => {
    const handleTransaction = provideHandleTransaction();

    // TO DO: 1. define interface, 2. call encodeFunctionData, 3. put output in setData parameter
    // const fortaRegistryInterface = new ethers.utils.Interface();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(nethermindAddress)
      .setTo(fortaRegistryAddress)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: mockCreateAgentAbi,
        arguments: [AGENT_ID, nethermindAddress, "metadata", CHAIN_IDS],
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
});

describe("7. detects bot update", () => {
  it("should return a finding", async () => {
    const handleTransaction = provideHandleTransaction();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(nethermindAddress)
      .setTo(fortaRegistryAddress)
      .addTraces({
        to: fortaRegistryAddress,
        from: nethermindAddress,
        function: mockUpdateAgentAbi,
        arguments: [AGENT_ID, nethermindAddress, "metadata", CHAIN_IDS],
      });

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(1);
    // expect(findings[0]).toEqual(
    //   expect.objectContaining({
    //     name: "Nethermind Bot Update",
    //     description: `Nethermind updated an existing bot with ID: 456`,
    //     alertId: "EXISTING-BOT-UPDATED",
    //     severity: FindingSeverity.Low,
    //     type: FindingType.Info,
    //   } as Finding)
    // );
  });
});

import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";

const netherMindAddress = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
const fortaRegistryAddress = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

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
      .setFrom(netherMindAddress)
      .setTo(createAddress("0x0"));

    // const mockTxEvent = {
    //   from: netherMindAddress,
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
      .setFrom(netherMindAddress)
      .setTo(fortaRegistryAddress);

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0);
  });
});

describe("4. returns empty findings if transaction calls createAgent but in wrong contract", () => {
  it("should return empty findings for createAgent function call", async () => {
    const handleTransaction = provideHandleTransaction();

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(netherMindAddress) // Correct from address
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
      .setFrom(netherMindAddress) // Correct from address
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

    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(netherMindAddress) // The address initiating the transaction (likely the bot owner or deployer)
      .setTo(fortaRegistryAddress) // The contract (Forta Registry) where the bot is being deployed
      .addEventLog(
        // Simulate a log for the createAgent function call
        "createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds)",
        fortaRegistryAddress, // Address where the log is emitted
        [
          "0x9b0e6c00c359cdd483291914dcd27bd74bc342ec74b6f7d334e0febe7c988025", // Agent ID from forta.config.json
          createAddress("0xabc"), // Mock owner address (the entity that deploys the bot)
          "metadata", // Mock metadata, can be simple
          [1, 137], // Chain IDs from package.json (Ethereum Mainnet and Polygon)
        ]
      );

    // const mockTxEvent = {
    //   from: netherMindAddress,
    //   to: fortaRegistryAddress,
    //   filterFunction: jest.fn().mockReturnValue([
    //     {
    //       name: "createAgent",
    //       args: { agentId: "123" },
    //     },
    //   ]),
    // } as unknown as TransactionEvent;

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        name: "Nethermind Bot Deployment",
        description: `Nethermind deployed a new bot with ID: 123`,
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
      .setFrom(netherMindAddress)
      .setTo(fortaRegistryAddress);

    // const mockTxEvent = {
    //   from: netherMindAddress,
    //   to: fortaRegistryAddress,
    //   filterFunction: jest.fn().mockReturnValue([
    //     {
    //       name: "updateAgent",
    //       args: { agentId: "456" },
    //     },
    //   ]),
    // } as unknown as TransactionEvent;

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual(
      expect.objectContaining({
        name: "Nethermind Bot Update",
        description: `Nethermind updated an existing bot with ID: 456`,
        alertId: "EXISTING-BOT-UPDATED",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
      } as Finding)
    );
  });
});

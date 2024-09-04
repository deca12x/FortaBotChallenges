import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import agent from "./agent";

let handleTransaction: HandleTransaction;
const mockNetherMindAddress = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
const mockFortaRegistryAddress = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

beforeAll(() => {
  handleTransaction = agent.handleTransaction;
});

describe("returns empty findings if transaction is not from Nethermind address", () => {
  it("should return empty findings", async () => {
    const mockTxEvent = {
      from: "0x1234567890123456789012345678901234567890",
      to: mockFortaRegistryAddress,
      filterFunction: jest.fn().mockReturnValue([]),
    } as unknown as TransactionEvent;

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0);
  });
});

describe("returns empty findings if transaction is not to Forta address", () => {
  it("should return empty findings", async () => {
    const mockTxEvent = {
      from: mockNetherMindAddress,
      to: "0x1234567890123456789012345678901234567890",
      filterFunction: jest.fn().mockReturnValue([]),
    } as unknown as TransactionEvent;

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0);
  });
});

describe("returns empty findings if neither createAgent nor updateAgent are detected", () => {
  it("should return empty findings", async () => {
    const mockTxEvent = {
      from: mockNetherMindAddress,
      to: mockFortaRegistryAddress,
      filterFunction: jest.fn().mockReturnValue([]),
    } as unknown as TransactionEvent;

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toHaveLength(0);
  });
});

describe("detects bot deployment", () => {
  it("should return a finding", async () => {
    const mockTxEvent = {
      from: mockNetherMindAddress,
      to: mockFortaRegistryAddress,
      filterFunction: jest.fn().mockReturnValue([
        {
          name: "createAgent",
          args: { agentId: "123" },
        },
      ]),
    } as unknown as TransactionEvent;

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

describe("detects bot update", () => {
  it("should return a finding", async () => {
    const mockTxEvent = {
      from: mockNetherMindAddress,
      to: mockFortaRegistryAddress,
      filterFunction: jest.fn().mockReturnValue([
        {
          name: "updateAgent",
          args: { agentId: "456" },
        },
      ]),
    } as unknown as TransactionEvent;

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

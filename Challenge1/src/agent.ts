import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { CREATE_AGENT_ABI, UPDATE_AGENT_ABI, NETHERMIND_ADDRESS, FORTA_REGISTRY_ADDRESS } from "./constants";

export function provideHandleTransaction(): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from.toLowerCase() !== NETHERMIND_ADDRESS.toLowerCase()) return findings;
    if (txEvent.to?.toLowerCase() !== FORTA_REGISTRY_ADDRESS.toLowerCase()) return findings;

    const filteredTxEvents = txEvent.filterFunction([CREATE_AGENT_ABI, UPDATE_AGENT_ABI], FORTA_REGISTRY_ADDRESS);

    filteredTxEvents.forEach((event) => {
      const isDeployment = event.name === "createAgent";
      findings.push(
        Finding.fromObject({
          name: isDeployment ? "Nethermind Bot Deployment" : "Nethermind Bot Update",
          description: `Nethermind ${isDeployment ? "deployed a new" : "updated an existing"} bot with ID: ${event.args.agentId?.toString()}`,
          alertId: isDeployment ? "NEW-BOT-DEPLOYED" : "EXISTING-BOT-UPDATED",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            agentId: event.args.agentId?.toString(),
            chainId: "137",
          },
        })
      );
    });

    return findings;
  };
}

// Provide function for initialize (if needed later)
export const provideInitialize = () => async () => {
  // Initialization logic if needed
};

// Default export as an object with initialize and handleTransaction
export default {
  initialize: provideInitialize(),
  handleTransaction: provideHandleTransaction(),
};

import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

const BOT_DEPLOYMENT_FUNCTION = "function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds)";
const BOT_UPDATE_FUNCTION = "function updateAgent(uint256 agentId,string metadata,uint256[] chainIds)";
const NETHERMIND_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
const FORTA_REGISTRY_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

export function provideHandleTransaction(): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from.toLowerCase() !== NETHERMIND_ADDRESS.toLowerCase()) return findings;
    if (txEvent.to?.toLowerCase() !== FORTA_REGISTRY_ADDRESS.toLowerCase()) return findings;

    const filteredTxEvents = txEvent.filterFunction(
      [BOT_DEPLOYMENT_FUNCTION, BOT_UPDATE_FUNCTION],
      FORTA_REGISTRY_ADDRESS
    );

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

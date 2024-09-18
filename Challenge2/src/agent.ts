import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent, ethers } from "forta-agent";
import { CREATE_AGENT_ABI, UPDATE_AGENT_ABI, NETHERMIND_ADDRESS, FORTA_REGISTRY_ADDRESS } from "./constants";

export function provideHandleTransaction(
  createAgentAbi: string,
  updateAgentAbi: string,
  nethermindAddress: string,
  fortaRegistryAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from.toLowerCase() !== nethermindAddress.toLowerCase()) return findings;
    if (txEvent.to?.toLowerCase() !== fortaRegistryAddress.toLowerCase()) return findings;

    const filteredTxEvents = txEvent.filterFunction([createAgentAbi, updateAgentAbi], fortaRegistryAddress);

    filteredTxEvents.forEach((event) => {
      const isDeployment = event.name === "createAgent";
      findings.push(
        Finding.fromObject({
          name: isDeployment ? "Nethermind Bot Deployment" : "Nethermind Bot Update",
          description: `Nethermind ${
            isDeployment ? "deployed a new" : "updated an existing"
          } bot with ID: ${event.args.agentId?.toString()}`,
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

export default {
  handleTransaction: provideHandleTransaction(
    CREATE_AGENT_ABI,
    UPDATE_AGENT_ABI,
    NETHERMIND_ADDRESS,
    FORTA_REGISTRY_ADDRESS
  ),
};

import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { CREATE_AGENT_ABI, UPDATE_AGENT_ABI, NETHERMIND_ADDRESS, FORTA_REGISTRY_ADDRESS, CHAIN_IDS } from "./constants";

export function provideHandleTransaction(
  createAgentAbi: string,
  updateAgentAbi: string,
  nethermindAddress: string,
  fortaRegistryAddress: string,
  chainId: string
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from.toLowerCase() !== nethermindAddress.toLowerCase()) return findings;
    if (txEvent.to?.toLowerCase() !== fortaRegistryAddress.toLowerCase()) return findings;

    const filteredFunctions = txEvent.filterFunction([createAgentAbi, updateAgentAbi], fortaRegistryAddress);

    filteredFunctions.forEach((filteredFunction) => {
      const isDeployment = filteredFunction.name === "createAgent";
      findings.push(
        Finding.fromObject({
          name: isDeployment ? "Nethermind Bot Deployment" : "Nethermind Bot Update",
          description: `Nethermind ${isDeployment ? "deployed a new" : "updated an existing"} bot with ID: ${filteredFunction.args.agentId?.toString()}`,
          alertId: isDeployment ? "NEW-BOT-DEPLOYED" : "EXISTING-BOT-UPDATED",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            agentId: filteredFunction.args.agentId?.toString(),
            chainId: chainId,
          },
        })
      );
    });

    return findings;
  };
}

// export const provideInitialize = () => async () => {
//   // Initialization logic if needed
// };

export default {
  handleTransaction: provideHandleTransaction(
    CREATE_AGENT_ABI,
    UPDATE_AGENT_ABI,
    NETHERMIND_ADDRESS,
    FORTA_REGISTRY_ADDRESS,
    CHAIN_IDS[0].toString()
  ),
};

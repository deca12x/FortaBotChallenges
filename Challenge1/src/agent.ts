import {
  BlockEvent,
  Finding,
  Initialize,
  HandleBlock,
  HealthCheck,
  HandleTransaction,
  HandleAlert,
  AlertEvent,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

// Constants
const BOT_DEPLOYMENT_FUNCTION = "function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds)";
const BOT_UPDATE_FUNCTION = "function updateAgent(uint256 agentId,string metadata,uint256[] chainIds)";
const NETHERMIND_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
const FORTA_REGISTRY_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";

// Provide the handleTransaction function with dependencies
const provideHandleTransaction = (nethermindAddress: string, fortaRegistryAddress: string): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from !== nethermindAddress.toLowerCase()) return findings;

    const deploymentCalls = txEvent.filterFunction(BOT_DEPLOYMENT_FUNCTION, fortaRegistryAddress);
    const updateCalls = txEvent.filterFunction(BOT_UPDATE_FUNCTION, fortaRegistryAddress);

    const processCalls = (calls: any[], functionType: string) => {
      calls.forEach((call) => {
        const isDeployment = functionType === BOT_DEPLOYMENT_FUNCTION;
        findings.push(
          Finding.fromObject({
            name: isDeployment ? "Nethermind Bot Deployment" : "Nethermind Bot Update",
            description: `Nethermind ${isDeployment ? "deployed a new" : "updated an existing"} bot with ID: ${call.args.agentId.toString()}`,
            alertId: isDeployment ? "NEW-BOT-DEPLOYED" : "EXISTING-BOT-UPDATED",
            severity: FindingSeverity.Low,
            type: FindingType.Info,
            metadata: {
              agentId: call.args.agentId.toString(),
            },
          })
        );
      });
    };

    processCalls(deploymentCalls, BOT_DEPLOYMENT_FUNCTION);
    processCalls(updateCalls, BOT_UPDATE_FUNCTION);

    return findings;
  };

  return handleTransaction;
};

// Exporting the handler function
export default {
  handleTransaction: provideHandleTransaction(NETHERMIND_ADDRESS, FORTA_REGISTRY_ADDRESS),
};

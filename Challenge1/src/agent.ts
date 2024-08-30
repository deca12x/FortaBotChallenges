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

export const BOT_DEPLOYMENT_FUNCTION =
  "function createAgent(uint256 agentId,address ,string metadata,uint256[] chainIds)";
const NETHERMIND_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8".toLowerCase();
const FORTA_REGISTRY_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";
let findingsCount = 0;

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;
  // only run this agent on the Nethermind address
  if (txEvent.from !== NETHERMIND_ADDRESS) return findings;

  const callsToCreateAgent = txEvent.filterFunction(BOT_DEPLOYMENT_FUNCTION, FORTA_REGISTRY_ADDRESS);

  callsToCreateAgent.forEach((call) => {
    findings.push(
      Finding.fromObject({
        name: "Nethermind Bot Deployment",
        description: `Nethermind deployed a new bot with ID: ${call.args.agentId}`,
        alertId: "NEW-BOT-DEPLOYED",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          agentId: call.args.agentId,
        },
      })
    );
    findingsCount++;
  });
  return findings;
};

// const initialize: Initialize = async () => {
//   // do some initialization on startup e.g. fetch data
// }

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

// const handleAlert: HandleAlert = async (alertEvent: AlertEvent) => {
//   const findings: Finding[] = [];
//   // detect some alert condition
//   return findings;
// }

// const healthCheck: HealthCheck = async () => {
//   const errors: string[] = [];
// detect some health check condition
// errors.push("not healthy due to some condition")
// return errors;
// }

export default {
  // initialize,
  handleTransaction,
  // healthCheck,
  // handleBlock,
  // handleAlert
};

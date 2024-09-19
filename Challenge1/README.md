# Nethermind Bot Creation and Update Detection Bot

## Description

A detection bot that detects Forta bots created and deployed by Nethermind.

## Supported Chains

- **Polygon**

## Alerts

### NEW-BOT-DEPLOYED

- Fired when the `createAgent` function in the Forta Registry contract is called by the Nethermind EOA (Externally Owned Account), i.e., a new Forta bot is deployed by Nethermind.
- **Severity**: Low
- **Type**: Info
- **Metadata**:
  - `agentId` (string)

### EXISTING-BOT-UPDATED

- **Fired**: When the `updateAgent` function in the Forta Registry contract is called by the Nethermind EOA, i.e., an existing Forta bot is updated by Nethermind.
- **Severity**: Low
- **Type**: Info
- **Metadata**:
  - `agentId` (string)
  - `chainId` (string)

## Test Data

The bot's functionality can be verified with the following transactions:

- `createAgent`:
  [0x6a72649c16d5246a207abdef78c8ce2148ed67c6c8a672bdac85e4c6ea2bdac8](https://polygonscan.com/tx/0x6a72649c16d5246a207abdef78c8ce2148ed67c6c8a672bdac85e4c6ea2bdac8)
- `updateAgent`:
  [0xc708473b78093b269b5fe5b674fb76fc88785866e1a5b28324edbe4744de5fbe](https://polygonscan.com/tx/0xc708473b78093b269b5fe5b674fb76fc88785866e1a5b28324edbe4744de5fbe)

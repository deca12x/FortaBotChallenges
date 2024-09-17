# Bot-Detection Bot

## Description

A bot that detects swaps on Uniswap V3.

## Supported Chains

- **Polygon**

## Alerts

### NEW-BOT-DEPLOYED

- **Fired**: When the `createAgent` function in the Forta Registry contract is called by the Nethermind EOA (Externally Owned Account), i.e., a new Forta bot is deployed by Nethermind.
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

## Test Data

The bot's functionality can be verified with the following conditions:

1. Returns empty findings if the transaction is **not from the Nethermind** address.
2. Returns empty findings if the transaction is **not to the Forta** address.
3. Returns empty findings if **neither** `createAgent` nor `updateAgent` are detected.
4. Detects **bot deployment**.
5. Detects **bot update**.

### Transaction Examples on Polygon:

- **createAgent**:
  [0x6a72649c16d5246a207abdef78c8ce2148ed67c6c8a672bdac85e4c6ea2bdac8](https://polygonscan.com/tx/0x6a72649c16d5246a207abdef78c8ce2148ed67c6c8a672bdac85e4c6ea2bdac8)

- **updateAgent**:
  [0xc708473b78093b269b5fe5b674fb76fc88785866e1a5b28324edbe4744de5fbe](https://polygonscan.com/tx/0xc708473b78093b269b5fe5b674fb76fc88785866e1a5b28324edbe4744de5fbe)

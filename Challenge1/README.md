# Bot-Detection Bot

## Description

This bot detects Forta bots deployed by Nethermind.

## Supported Chains

- Polygon

## Alerts

- NEW-BOT-DEPLOYED

  - Fired when the `createAgent` function in the Forta Registry contract is called by the Nethermind EOA, i.e. a new Forta Bot is deployed by Nethermind
  - Severity is always set to "low"
  - Type is always set to "info"
  - Metadata: agentId (string)

- EXISTING-BOT-UPDATED
  - Fired when the `updateAgent` function in the Forta Registry contract is called by the Nethermind EOA, i.e. an existing Forta Bot is updated by Nethermind
  - Severity is always set to "low"
  - Type is always set to "info"
  - Metadata: agentId (string)

## Test Data

The bot's functionality is as follows:

1. returns empty findings if transaction is not from Nethermind address
2. returns empty findings if transaction is not to Forta address
3. returns empty findings if neither createAgent nor updateAgent are detected
4. detects bot deployment
5. detects bot update

Detection of bot creation and updating can be verified with the following transactions on Polygon:

`createAgent`
https://polygonscan.com/tx/0x6a72649c16d5246a207abdef78c8ce2148ed67c6c8a672bdac85e4c6ea2bdac8

`updateAgent`
https://polygonscan.com/tx/0xc708473b78093b269b5fe5b674fb76fc88785866e1a5b28324edbe4744de5fbe

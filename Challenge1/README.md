# Nethermind Deployment of Forta Bots

## Description

This bot detects Forta bots deployed by Nethermind.

## Supported Chains

- Ethereum
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

1. returns empty findings if transaction is not from Nethermind address
2. returns empty findings if transaction is not to Forta address
3. returns empty findings if neither createAgent nor updateAgent are detected
4. detects bot deployment
5. detects bot update

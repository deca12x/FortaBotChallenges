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

## Test Data

<!-- The bot behaviour can be verified with the following transactions:

The test transaction examples should follow the format: [//txn hash//](//link to txn hash in block explorer//)
- 0x3a0f757030beec55c22cbc545dd8a844cbbb2e6019461769e1bc3f3a95d10826 (15,000 USDT) -->

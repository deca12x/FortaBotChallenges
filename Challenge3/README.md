# MakerDAO Bridge Invariant Bot

## Description

This bot monitors the DAI locked in L1 escrow contracts for Optimism and Arbitrum and compares it with the DAI supply on Optimism and Arbitrum networks.

## Supported Chains

- Ethereum (chainId: 1)
- Optimism (chainId: 10)
- Arbitrum (chainId: 42161)

## Alerts

### L1-DAI-LOCKED

- **Fired**: When there's a change in the DAI balance locked in L1 escrow contracts for Optimism and Arbitrum.
- **Severity**: Info
- **Type**: Info
- **Metadata**:
  - `l1OptEscrowBalance` (string): DAI balance locked for Optimism
  - `l1ArbEscrowBalance` (string): DAI balance locked for Arbitrum

### BRIDGE-BREACHED

- **Fired**: When the L2 DAI supply exceeds the amount of DAI locked in the corresponding L1 escrow contract.
- **Severity**: High
- **Type**: Exploit
- **Metadata**:
  - `l1DaiLocked` (string): Amount of DAI locked in L1 escrow
  - `l2DaiSupply` (string): Total supply of DAI on L2

## Test Data

The bot's functionality can be verified with the following conditions:

1. Returns a finding when there's a change in L1 escrow balances for Optimism or Arbitrum.
2. Returns no finding when L1 escrow balances remain unchanged.
3. Returns a finding when L2 DAI supply exceeds L1 locked DAI for Optimism.
4. Returns a finding when L2 DAI supply exceeds L1 locked DAI for Arbitrum.
5. Returns no finding when L2 DAI supply is less than or equal to L1 locked DAI.

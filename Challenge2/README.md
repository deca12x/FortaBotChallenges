# Uniswap Detection Bot

## Description

This bot detects Uniswap V3 swaps on Ethereum Mainnet.

## Supported Chains

- **Ethereum**

## Alerts

### UNISWAPV3-SWAP-DETECTED

- **Fired**: When the `Swap` event is emitted from an offical Uniswap V3 pool. The real pool's address is found using the Uniswap V3 Factory address, the Uniswap V3 Init Code hash and the intercepted pool values.
- **Severity**: Low
- **Type**: Info
- **Metadata**:
  - `poolAddress` (string)
  - `sender` (string)
  - `interceptedPoolAddress` (string)
  - `amount0` (string)
  - `amount1` (string)

## Test Data

The bot's functionality can be verified with the following conditions:

1. Returns empty findings if the transaction **does not emit a Swap event** and **is not directed to an official Uniswap V3 pool**.
2. Returns empty findings if the transaction **emits a Swap event** but **is not directed to an official Uniswap V3 pool**.
3. Returns empty findings if the transaction **is directed to an official Uniswap V3 pool** but **does not emit a Swap event**.
4. Returns one finding if the transaction **emits a Swap event** and **is directed to an official Uniswap V3 pool**.
5. Returns multiple findings if the transaction **emits multiple Swap events** and **is directed to an official Uniswap V3 pool**.

### Transaction Examples on Ethereum:

- **Swap event**:
  [0x90c626d175971f12443019203da8b113e98df9dc5ea5bb642df247c2ffc9843c](https://etherscan.io/tx/0x90c626d175971f12443019203da8b113e98df9dc5ea5bb642df247c2ffc9843c)

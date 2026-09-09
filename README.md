# Robinhood Chain Prediction Market

A decentralized prediction market built on the Robinhood Chain, focusing on a seamless user experience similar to Web2 applications with the security and transparency of Web3.

## Architecture

This project is structured as a Monorepo using `pnpm` workspaces.

### Workspaces
- `apps/web`: The Next.js 15 frontend application, designed with Tailwind CSS and atomic design principles.
- `apps/backend`: Node.js/Express backend for the offchain Central Limit Order Book (CLOB) and indexer API.
- `packages/contracts`: Hardhat environment for the core Smart Contracts (ERC-1155 Conditional Tokens, Exchange, and Oracles).

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the frontend development server:
   ```bash
   pnpm --filter web dev
   ```

## Networks

- **Robinhood Chain Testnet**: Chain ID `46630`
- **Robinhood Chain Mainnet**: Chain ID `4663`
- **USDG Token Address (Mainnet)**: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`

## Development Guidelines
- Always use the real Robinhood Chain environment or testnet for validation.
- Maintain atomic design and clean code standards.
- Follow the EIP-712 standard for offchain signatures.

*Disclaimer: This is a testnet-compatible protocol.*

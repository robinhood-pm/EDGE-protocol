# Edge Protocol

> The prediction layer for Robinhood Chain — trade the probability of future outcomes.

[![CA](https://img.shields.io/badge/CA-0x9a6e4fdce052186e942e8267424f1df0ded3ff5a-blue?style=for-the-badge&logo=ethereum)](https://robinhoodchain.blockscout.com/address/0x9a6e4fdce052186e942e8267424f1df0ded3ff5a)
[![X (Twitter)](https://img.shields.io/badge/X-@Edgeprotocjoac-black?style=for-the-badge&logo=x)](https://x.com/Edgeprotocjoac)

A prediction market protocol built natively on **Robinhood Chain** where users can trade binary YES/NO outcome tokens backed by USDG collateral. Designed to feel as simple as Polymarket with finance-first markets covering crypto, equities, macro, rates, earnings, and economic events.

### Deployed Contracts (Robinhood Chain)

| Contract | Address |
|----------|---------|
| **Conditional Tokens** | [`0xEBf89888966e48D54825635EDa18946C78407E6e`](https://robinhoodchain.blockscout.com/address/0xEBf89888966e48D54825635EDa18946C78407E6e) |
| **Market Factory** | [`0x387D0Ea34b98441a33f92dfb75f7f23Fd1579898`](https://robinhoodchain.blockscout.com/address/0x387D0Ea34b98441a33f92dfb75f7f23Fd1579898) |
| **Fee Treasury** | [`0xD8F8b69aBA4D7803d48249F75c2776b07407Efc2`](https://robinhoodchain.blockscout.com/address/0xD8F8b69aBA4D7803d48249F75c2776b07407Efc2) |
| **Exchange** | [`0x88488C742a8307D9A515f6BC5e01Aa09a1a4e910`](https://robinhoodchain.blockscout.com/address/0x88488C742a8307D9A515f6BC5e01Aa09a1a4e910) |

---


## Table of Contents

- [Product Vision](#product-vision)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Smart Contracts](#smart-contracts)
- [Trading Model](#trading-model)
- [Outcome Token Model](#outcome-token-model)
- [Resolution System](#resolution-system)
- [Fee Model](#fee-model)
- [Network Configuration](#network-configuration)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [WebSocket Channels](#websocket-channels)
- [Market Lifecycle](#market-lifecycle)
- [Development Phases](#development-phases)
- [Security](#security)
- [License](#license)

---

## Product Vision

Build a professional-grade prediction market where users can:

1. Browse a market
2. Choose **YES** or **NO**
3. Enter an amount
4. Buy or sell a position
5. Watch market-implied probability move in real time
6. Redeem the winning position after resolution

### Core Principle

Every binary market has two outcome assets — **YES** and **NO**. The market price represents the market-implied probability.

```
YES = $0.64 → displayed as 64%
NO  = $0.36 → displayed as 36%

If YES resolves:  1 YES = $1.00  |  1 NO = $0.00
If NO resolves:   1 NO  = $1.00  |  1 YES = $0.00
```

The system remains **fully collateralized** — for every complete YES + NO pair, $1 of USDG collateral must exist.

### Example Markets

| Category | Example |
|----------|---------|
| Crypto | Will BTC trade above $150,000 before December 31, 2026? |
| Crypto | Will ETH outperform BTC this month? |
| Macro | Will the Fed cut rates at the next FOMC meeting? |
| Economy | Will US CPI YoY print below 3.0%? |
| Stocks | Will the AAPL reference price close above $250 on Friday? |
| Earnings | Will NVDA reference price reach $200 before Q4 ends? |

---

## Architecture

```
                     ┌─────────────────────┐
                     │      Frontend       │
                     │ Next.js / React     │
                     └──────────┬──────────┘
                                │
                                │ REST / WebSocket
                                ▼
                 ┌──────────────────────────┐
                 │      API Gateway         │
                 │ Market / User / Trading  │
                 └────────────┬─────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌────────────────┐   ┌────────────────┐   ┌─────────────────┐
│ Matching Engine│   │ Market Service │   │ Indexer / Stats  │
│ Offchain CLOB  │   │ Metadata       │   │ Events / PnL     │
└───────┬────────┘   └────────────────┘   └─────────────────┘
        │
        │ Matched EIP-712 Orders
        ▼
┌─────────────────────────────┐
│ Robinhood Chain Contracts   │
│                             │
│ MarketFactory               │
│ ConditionalTokens           │
│ Exchange                    │
│ ResolutionOracle            │
│ FeeTreasury                 │
└──────────────┬──────────────┘
               │
      ┌────────┴─────────┐
      │                  │
      ▼                  ▼
┌───────────┐      ┌───────────────┐
│   USDG    │      │ Oracle Layer  │
│Collateral │      │ Chainlink /   │
└───────────┘      │ Event Resolver│
                   └───────────────┘
```

---

## Monorepo Structure

This project uses **pnpm workspaces** with **Turborepo** for build orchestration.

```
robinhood-pm/
├── apps/
│   ├── web/                    # Next.js 15 frontend (Tailwind CSS, wagmi, viem)
│   └── backend/                # Node.js/Express backend
│       └── src/
│           ├── controllers/    # Route handlers
│           ├── routes/         # API route definitions
│           ├── services/       # Core business logic
│           │   ├── matchingEngine.ts   # Offchain CLOB matching
│           │   ├── RelayerService.ts   # Onchain settlement relayer
│           │   ├── indexer.ts          # Blockchain event indexer
│           │   └── OracleService.ts    # Oracle integration
│           ├── types/          # TypeScript type definitions
│           └── utils/          # Shared utilities
│
├── packages/
│   ├── contracts/              # Solidity smart contracts (Hardhat)
│   │   └── contracts/
│   │       ├── MarketFactory.sol
│   │       ├── ConditionalTokens.sol
│   │       ├── Exchange.sol
│   │       ├── FeeTreasury.sol
│   │       ├── interfaces/
│   │       │   └── IResolutionOracle.sol
│   │       └── oracles/
│   │           ├── ChainlinkPriceAdapter.sol
│   │           └── ManualResolverAdapter.sol
│   ├── eslint-config/          # Shared ESLint configuration
│   └── typescript-config/      # Shared TypeScript configuration
│
├── package.json                # Root workspace config
├── pnpm-workspace.yaml
└── turbo.json                  # Turborepo pipeline config
```

---

## Smart Contracts

### MarketFactory.sol

Deploys and registers new prediction markets. Stores canonical market IDs with validation for unique question IDs, valid close times, supported collateral, and market creator authorization.

### ConditionalTokens.sol

**ERC-1155** position layer responsible for:
- **Split** — deposit $1 collateral → mint 1 YES + 1 NO
- **Merge** — return 1 YES + 1 NO → receive $1 collateral
- **Redeem** — after resolution, winning token → $1 collateral

> **Critical Invariant:** Total redeemable outcome value ≤ collateral locked by protocol

### Exchange.sol

Atomic settlement of matched signed orders. Validates EIP-712 signatures, nonces, expirations, balances, and allowances. Prevents replay attacks and applies protocol fees.

```solidity
struct Order {
    address maker;
    address signer;
    address token;
    uint256 tokenId;
    uint256 price;
    uint256 amount;
    uint256 expiration;
    uint256 nonce;
    Side side;
}
```

### FeeTreasury.sol

Collects and manages protocol trading fees with controlled treasury withdrawals. Owned by multisig.

### Oracle Adapters

| Adapter | Use Case |
|---------|----------|
| `ChainlinkPriceAdapter` | Price-based markets (BTC, ETH, Stock Tokens, Forex) |
| `ManualResolverAdapter` | Event-based markets (Fed decisions, earnings, policy) |

Resolution architecture supports pluggable adapters via `IResolutionOracle`:

```
ResolutionOracle
├── ChainlinkPriceAdapter
├── ManualResolverAdapter
├── OptimisticOracleAdapter (V2)
└── FutureGovernanceAdapter (V2)
```

---

## Trading Model

### Hybrid CLOB (Central Limit Order Book)

Orders are:
1. **Created** client-side
2. **Signed** by the user's wallet using **EIP-712**
3. **Submitted** to the offchain order book
4. **Matched** offchain with price-time priority
5. **Settled** onchain through the Exchange contract

> The backend can **never** create a valid user order without the user's cryptographic signature.

### Supported Order Types (MVP)

- Market Buy / Sell
- Limit Buy / Sell
- Cancel Order
- Cancel All Orders

### Order Signing (EIP-712)

Domain includes `name`, `version`, `chainId`, `verifyingContract`. Orders include `maker`, `market`, `outcome`, `side`, `price`, `amount`, `expiration`, `nonce`, `salt` — protecting against cross-chain/cross-contract replay.

---

## Outcome Token Model

**ERC-1155** tokens for each binary market:

```
Market
├── YES token (tokenId)
└── NO token (tokenId)
```

Each market tracks: `marketId`, `conditionId`, `questionId`, `YES/NO tokenIds`, `collateralToken`, `startTime`, `closeTime`, `resolutionTime`, `oracleType`, `marketStatus`.

---

## Resolution System

Every market defines: **Question**, **Resolution Criteria**, **Primary/Backup Data Source**, **Close Time**, **Resolution Time**, **Timezone**, **Edge Cases**, and **Invalid Market Conditions**.

### Price-Based (Oracle Type A)

Uses Chainlink onchain feeds for deterministic price markets.

```
Market expires → Oracle adapter reads price → Validation → Market resolves → Winning token redeemable
```

### Event-Based (Oracle Type B)

For non-deterministic events (Fed decisions, policy, earnings).

```
Authorized Resolver → Propose Outcome → Dispute Window (6-24h) → Finalize
```

### Market States

```
DRAFT → OPEN → PAUSED → CLOSED → PROPOSED → DISPUTED → RESOLVED_YES / RESOLVED_NO / INVALID
```

### Invalid Market Handling

If a market becomes unresolvable, the recommended payout is **YES = $0.50, NO = $0.50** to conserve total collateral.

---

## Fee Model

| Type | Fee |
|------|-----|
| **Taker** | 0.50% |
| **Maker** | 0.00% |

- Maximum protocol-enforced fee cap: **2%** (`MAX_FEE_BPS = 200`)
- Fees are governance-configurable with hard cap
- Maker rebates planned post anti-wash-trading infrastructure

---

## Network Configuration

### Robinhood Chain Mainnet

| Parameter | Value |
|-----------|-------|
| Chain ID | `4663` |
| Native Gas Token | `ETH` |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Block Explorer | `https://robinhoodchain.blockscout.com` |
| USDG Token | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |

### Robinhood Chain Testnet

| Parameter | Value |
|-----------|-------|
| Chain ID | `46630` |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | `https://explorer.testnet.chain.robinhood.com` |

> **Production:** Use a dedicated RPC provider (e.g., Alchemy) instead of the public rate-limited RPC.

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, TypeScript, React, Tailwind CSS, wagmi, viem, TanStack Query |
| **Backend** | Node.js, TypeScript, Express, PostgreSQL, Redis, WebSocket, BullMQ |
| **Contracts** | Solidity, Hardhat, OpenZeppelin, EIP-712, ERC-1155, ERC-20 |
| **Infra** | Alchemy (Robinhood Chain RPC), Docker, Cloudflare, Sentry, Prometheus/Grafana |
| **Wallets** | Robinhood Wallet, MetaMask, WalletConnect (EVM-compatible) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9.15.0

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all workspaces
pnpm dev

# Frontend only
pnpm --filter web dev

# Backend only
pnpm --filter backend dev

# Compile contracts
pnpm --filter contracts compile
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Development Flow

```
Local tests → Robinhood Chain Testnet → Audit/Review → Robinhood Chain Mainnet
```

---

## API Reference

### Public Endpoints

```
GET  /markets                  # List all markets
GET  /markets/:slug            # Market detail
GET  /markets/:id/orderbook    # Order book snapshot
GET  /markets/:id/trades       # Recent trades
GET  /markets/:id/history      # Price history
GET  /categories               # Market categories
GET  /search                   # Search markets
GET  /activity                 # Live activity feed
```

### Trading Endpoints

```
POST   /auth/challenge         # Request auth challenge
POST   /auth/verify            # Verify wallet signature

POST   /orders                 # Submit signed order
DELETE /orders/:orderHash      # Cancel specific order
DELETE /orders                 # Cancel all orders
GET    /orders                 # List user orders

GET    /positions              # User positions
GET    /portfolio              # Portfolio summary
GET    /claimable              # Claimable winnings
```

### Admin Endpoints

```
POST /admin/markets                # Create market
POST /admin/markets/:id/close      # Close market
POST /admin/resolution/propose     # Propose resolution
POST /admin/resolution/finalize    # Finalize resolution
```

---

## WebSocket Channels

```
market:{marketId}:book         # Order book updates
market:{marketId}:trades       # Trade stream
market:{marketId}:price        # Price updates
market:{marketId}:status       # Market status changes
user:{address}:orders          # User order updates
user:{address}:fills           # User fill notifications
user:{address}:positions       # Position changes
```

---

## Market Lifecycle

### Example: "Will BTC reach $150,000 before December 31, 2026?"

```
1. Market created (YES 40¢ / NO 60¢)
2. User buys 1,000 YES @ 40¢ → Cost = $400
3. Price moves → YES = 70¢ → Position value = $700
4. User can sell before resolution OR hold
5. Market closes → Resolution proposed
6. Dispute period (6-24h)
7. Result finalized → YES wins
8. User redeems → 1,000 × $1.00 = $1,000
9. Gross profit = $1,000 - $400 = $600
```

---

## Security

### Critical Invariants

```
✓ Collateral locked >= aggregate redeemable liability
✓ A signed order cannot fill beyond its amount
✓ An expired order cannot fill
✓ A canceled order cannot fill
✓ A resolved market cannot reopen
✓ Resolution cannot be changed after finalization
✓ Winning token redemptions cannot exceed collateral
```


### Admin Roles (Separation of Concerns)

```
DEFAULT_ADMIN  |  MARKET_CREATOR  |  RESOLVER  |  PAUSER  |  FEE_MANAGER  |  UPGRADER
```

Production owner: **Multisig**

---

## Key References

- [Robinhood Chain Docs](https://docs.robinhood.com/chain/)
- [Robinhood Chain Connection](https://docs.robinhood.com/chain/connecting/)
- [Robinhood Chain Contract Deployment](https://docs.robinhood.com/chain/deploy-smart-contracts/)
- [Robinhood Chain Stock Tokens](https://docs.robinhood.com/chain/stock-tokens/)
- [Robinhood Chain Data Streams](https://docs.robinhood.com/chain/data-streams/)

---

## Definition of Done (MVP)

MVP is complete when two independent wallets can:

1. Connect to Robinhood Chain
2. Hold USDG
3. Open the same binary market
4. Place opposite orders
5. Match those orders
6. Settle the trade onchain
7. See updated positions and PnL
8. Close the market
9. Resolve the result
10. Redeem the winning position for collateral

> Everything must be verifiable through Robinhood Chain contract events.

---

*Disclaimer: This is a testnet-compatible protocol. Not an official Robinhood product.*

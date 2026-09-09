import ConditionalTokensABI from './abis/ConditionalTokens.json';
import MarketFactoryABI from './abis/MarketFactory.json';
import ExchangeABI from './abis/Exchange.json';
import FeeTreasuryABI from './abis/FeeTreasury.json';

// ERC20 Minimal ABI for USDG interactions
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
] as const;

export const CONTRACT_ADDRESSES = {
  // Hardcoded or dynamically pulled from env for Robinhood Testnet
  USDG: process.env.NEXT_PUBLIC_USDG_ADDRESS as `0x${string}`,
  
  // These will be populated after deployment scripts are run.
  // For now, using placeholders or env vars if provided.
  ConditionalTokens: process.env.NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS as `0x${string}`,
  MarketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as `0x${string}`,
  Exchange: process.env.NEXT_PUBLIC_EXCHANGE_ADDRESS as `0x${string}`,
  FeeTreasury: process.env.NEXT_PUBLIC_FEE_TREASURY_ADDRESS as `0x${string}`,
} as const;

export const ABIS = {
  ConditionalTokens: ConditionalTokensABI.abi,
  MarketFactory: MarketFactoryABI.abi,
  Exchange: ExchangeABI.abi,
  FeeTreasury: FeeTreasuryABI.abi,
  ERC20: ERC20_ABI,
} as const;

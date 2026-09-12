import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const chainId = Number(process.env.ROBINHOOD_CHAIN_ID || 46630);
export const staticNetwork = ethers.Network.from(chainId);

export function getStaticProvider(rpcUrl?: string): ethers.JsonRpcProvider {
  const url = rpcUrl || process.env.ROBINHOOD_RPC_URL || process.env.RPC_URL;
  if (!url) {
    throw new Error('Missing RPC URL for JsonRpcProvider');
  }
  return new ethers.JsonRpcProvider(url, staticNetwork, { staticNetwork });
}

export function safeAddress(addr?: string | null): string {
  if (!addr || typeof addr !== 'string') return ethers.ZeroAddress;
  try {
    return ethers.getAddress(addr);
  } catch {
    try {
      return ethers.getAddress(addr.toLowerCase());
    } catch {
      return ethers.ZeroAddress;
    }
  }
}

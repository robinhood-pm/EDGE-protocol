import { useSignTypedData, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

// EIP-712 Domain Types for Exchange
const domain = {
  name: 'EdgeProtocolExchange',
  version: '1',
  chainId: Number(process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID),
  verifyingContract: CONTRACT_ADDRESSES.Exchange,
} as const;

const types = {
  Order: [
    { name: 'maker', type: 'address' },
    { name: 'marketId', type: 'uint256' },
    { name: 'outcome', type: 'uint8' },
    { name: 'amount', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'isBuy', type: 'bool' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
  ],
} as const;

export function useExchange() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const signOrder = async (
    marketId: number,
    outcome: 0 | 1,
    amountStr: string,
    priceStr: string,
    isBuy: boolean
  ) => {
    if (!address) throw new Error("Wallet not connected");

    // Convert values
    // Assume 6 decimals for USDG and Shares to avoid overflow, or handle properly in backend.
    const amount = BigInt(parseFloat(amountStr) * 1e6);
    const price = BigInt(parseFloat(priceStr) * 1e6); // total price cost
    const nonce = BigInt(Date.now()); // Simple pseudo-random nonce for MVP
    const expiration = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24 hours

    const message = {
      maker: address as `0x${string}`,
      marketId: BigInt(marketId),
      outcome,
      amount,
      price,
      isBuy,
      nonce,
      expiration,
    };

    try {
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Order',
        message,
      });

      return {
        order: message,
        signature
      };
    } catch (error) {
      console.error("Signature failed:", error);
      throw error;
    }
  };

  return {
    signOrder
  };
}

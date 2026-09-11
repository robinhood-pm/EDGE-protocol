import { parseUnits, keccak256, toHex } from 'viem';
import { useSignTypedData } from 'wagmi';

const DOMAIN = {
  name: 'EdgeProtocolPerpExchange',
  version: '1',
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
  verifyingContract: process.env.NEXT_PUBLIC_PERP_EXCHANGE_ADDRESS as `0x${string}`
};

const TYPES = {
  PerpOrder: [
    { name: 'maker', type: 'address' },
    { name: 'perpMarketId', type: 'uint256' },
    { name: 'isLong', type: 'bool' },
    { name: 'size', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'margin', type: 'uint256' },
    { name: 'leverage', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiration', type: 'uint256' }
  ]
};

/**
 * Hook to sign a Perp Order using EIP-712 Typed Data
 */
export function useSignPerpOrder() {
  const { signTypedDataAsync } = useSignTypedData();

  const signOrder = async (orderData: {
    maker: string;
    marketId: string;
    isLong: boolean;
    size: string;
    price: string;
    margin: string;
    leverage: string;
    nonce: number;
    expiration: number;
  }) => {
    
    // Parse to WEI (18 decimals) for the smart contract, even though backend does it too, 
    // the signature must match exactly what the contract expects (WEI).
    const message = {
      maker: orderData.maker as `0x${string}`,
      // Hash the string marketId to get a uint256 compatible number
      perpMarketId: BigInt(keccak256(toHex(orderData.marketId))), 
      isLong: orderData.isLong,
      size: parseUnits(orderData.size, 18),
      price: parseUnits(orderData.price, 18),
      margin: parseUnits(orderData.margin, 18),
      leverage: parseUnits(orderData.leverage, 18),
      nonce: BigInt(orderData.nonce),
      expiration: BigInt(orderData.expiration)
    };

    try {
      const signature = await signTypedDataAsync({
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'PerpOrder',
        message: message as any,
      });

      return signature;
    } catch (error) {
      console.error("Signature failed", error);
      throw error;
    }
  };

  return { signOrder };
}

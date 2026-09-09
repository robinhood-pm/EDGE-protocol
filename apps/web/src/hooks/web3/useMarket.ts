import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { ABIS, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { parseUnits } from 'viem';

export function useMarket(marketId: number) {
  const { address } = useAccount();

  // Read market details
  const { data: marketData, isLoading: isLoadingMarket, refetch: refetchMarket } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketFactory,
    abi: ABIS.MarketFactory,
    functionName: 'markets',
    args: [BigInt(marketId)],
  });

  // Read user's YES balance
  const { data: yesBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.ConditionalTokens,
    abi: ABIS.ConditionalTokens,
    functionName: 'balanceOf',
    args: [address as `0x${string}`, BigInt(marketId * 2 + 1)], // YES token ID logic
    query: {
      enabled: !!address && !!marketId,
    }
  });

  // Read user's NO balance
  const { data: noBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.ConditionalTokens,
    abi: ABIS.ConditionalTokens,
    functionName: 'balanceOf',
    args: [address as `0x${string}`, BigInt(marketId * 2)], // NO token ID logic
    query: {
      enabled: !!address && !!marketId,
    }
  });

  return {
    marketData,
    isLoadingMarket,
    refetchMarket,
    balances: {
      yes: yesBalance ? Number(yesBalance) / 1e6 : 0, // Assuming 6 decimals for shares
      no: noBalance ? Number(noBalance) / 1e6 : 0,
    }
  };
}

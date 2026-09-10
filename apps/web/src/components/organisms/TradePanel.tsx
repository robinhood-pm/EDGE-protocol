"use client";

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Settings2, Loader2 } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { logActivity } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { MarketDetail } from '@/types';

interface TradePanelProps {
  market: MarketDetail;
}

export function TradePanel({ market }: TradePanelProps) {
  const { address, isConnected } = useAccount();
  const [amountStr, setAmountStr] = useState<string>('5');
  const [selectedOutcome, setSelectedOutcome] = useState<0 | 1>(1); // 1 = YES/UP, 0 = NO/DOWN
  const amountToSpend = parseUnits(amountStr || '0', 6);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  // Fetch Orderbook
  const { data: orderbookData } = useQuery({
    queryKey: ['orderbook', market.id],
    queryFn: async () => {
      const response = await fetch(`${backendUrl}/api/orders/${market.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 3000 // Poll every 3 seconds for now
  });
  
  // Read USDG Balance
  const { data: balanceData } = useReadContract({
    address: CONTRACT_ADDRESSES.USDG,
    abi: ABIS.ERC20,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
  
  const balance = balanceData ? (balanceData as bigint) : BigInt(0);
  const isInsufficient = balance < amountToSpend;

  // Read USDG Allowance for Exchange
  const { data: allowanceData } = useReadContract({
    address: CONTRACT_ADDRESSES.USDG,
    abi: ABIS.ERC20,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.Exchange] : undefined,
    query: { enabled: !!address }
  });
  
  const allowance = allowanceData ? (allowanceData as bigint) : BigInt(0);
  const needsApproval = allowance < amountToSpend;

  // Write Contract (Approve)
  const { writeContract: approve, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isWaitingApprove } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // Sign Order
  const { signTypedDataAsync } = useSignTypedData();
  const [isSigning, setIsSigning] = useState(false);

  const handleApprove = () => {
    approve({
      address: CONTRACT_ADDRESSES.USDG,
      abi: ABIS.ERC20,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.Exchange, amountToSpend],
    });
  };

  const handleBuy = async (outcome: 0 | 1) => {
    if (!address) return;
    try {
      setIsSigning(true);
      
      const domain = {
        name: "EdgeProtocolExchange",
        version: "1",
        chainId: Number(process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID),
        verifyingContract: CONTRACT_ADDRESSES.Exchange as `0x${string}`
      };
      
      const types = {
        Order: [
          { name: "maker", type: "address" },
          { name: "marketId", type: "uint256" },
          { name: "outcome", type: "uint8" },
          { name: "amount", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "isBuy", type: "bool" },
          { name: "nonce", type: "uint256" },
          { name: "expiration", type: "uint256" },
        ]
      };

      // Math: price in 6 decimals, amount is number of shares in 6 decimals
      const priceNum = selectedOutcome === 1 ? market.currentPrice : (1 - market.currentPrice);
      const priceContract = BigInt(Math.floor(priceNum * 1000000));
      const sharesContract = (amountToSpend * BigInt(1000000)) / priceContract;

      const order = {
        maker: address,
        marketId: BigInt(market.id),
        outcome,
        amount: sharesContract, // Number of shares
        price: priceContract, // Price per share
        isBuy: true,
        nonce: BigInt(Math.floor(Math.random() * 1000000)),
        expiration: BigInt(Math.floor(Date.now() / 1000) + 3600)
      };

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Order',
        message: order
      });

      console.log("Order Signed:", order, "Signature:", signature);

      // Convert BigInts to Strings for JSON transport
      const rawOrderForBackend = {
        maker: order.maker,
        marketId: order.marketId.toString(),
        outcome: order.outcome,
        amount: order.amount.toString(),
        price: order.price.toString(),
        isBuy: order.isBuy,
        nonce: order.nonce.toString(),
        expiration: order.expiration.toString()
      };

      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: market.id,
          wallet_address: address,
          side: selectedOutcome === 1 ? 'YES' : 'NO',
          order_type: 'LIMIT',
          amount: Number(formatUnits(sharesContract, 6)),
          price: priceNum,
          signature: signature,
          rawOrder: rawOrderForBackend
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order to backend');
      }

      toast.success("Order submitted successfully to the Orderbook!");
      logActivity('CREATE_ORDER', {
        market_id: market.id,
        side: 'BUY',
        amount: amountToSpend.toString()
      }, address);
      
    } catch (e: any) {
      console.error("Order submission failed:", e);
      toast.error(`Error: ${e.message}`);
      logActivity('ERROR', {
        type: 'ORDER_CREATION_FAILED',
        error: e.message,
        market_id: market.id
      }, address);
    } finally {
      setIsSigning(false);
    }
  };

  const outcomePrice = selectedOutcome === 1 ? market.currentPrice : (1 - market.currentPrice);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center overflow-hidden">
            <img src={market.image} alt={market.title} className="w-4 h-4 object-contain" />
          </div>
          <span className="font-bold text-sm truncate w-40">{market.title}</span>
        </div>
        <span className="text-yes font-bold text-sm">Up</span>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 text-sm font-medium border-b border-border pb-4 mb-4">
          <button className="text-foreground">Buy</button>
          <button className="text-muted hover:text-foreground">Sell</button>
          <div className="ml-auto flex items-center gap-2 text-muted">
            <span>1-Tap</span> <Settings2 className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            variant={selectedOutcome === 1 ? "yes" : "secondary"} 
            className={`h-12 text-sm font-bold shadow-sm ${selectedOutcome === 1 ? 'shadow-yes/20' : ''}`} 
            onClick={() => setSelectedOutcome(1)}
          >
            UP {market.currentPrice * 100}¢
          </Button>
          <Button 
            variant={selectedOutcome === 0 ? "no" : "secondary"} 
            className={`h-12 text-sm font-bold ${selectedOutcome === 0 ? 'text-white' : 'text-foreground'}`} 
            onClick={() => setSelectedOutcome(0)}
          >
            DOWN {(1 - market.currentPrice) * 100}¢
          </Button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Amount (USDG)</span>
          <input 
            type="number" 
            value={amountStr} 
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-20 bg-background border border-border rounded px-2 py-1 text-right text-sm outline-none"
          />
        </div>

        {!isConnected ? (
          <div className="text-center text-xs text-muted mb-4 pt-2">Please connect your wallet</div>
        ) : isInsufficient ? (
          <div className="text-center text-xs text-red-500 font-medium mb-4 pt-2">Insufficient USDG Funds</div>
        ) : needsApproval ? (
          <Button 
            className="w-full mb-4 font-bold" 
            onClick={handleApprove} 
            disabled={isApproving || isWaitingApprove}
          >
            {(isApproving || isWaitingApprove) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve USDG'}
          </Button>
        ) : (
          <Button 
            variant={selectedOutcome === 1 ? "yes" : "no"} 
            className="w-full mb-4 font-bold text-white" 
            onClick={() => handleBuy(selectedOutcome)} 
            disabled={isSigning}
          >
            {isSigning ? <Loader2 className="w-4 h-4 animate-spin" /> : `Sign Buy ${selectedOutcome === 1 ? 'UP' : 'DOWN'} Order`}
          </Button>
        )}
        
        <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-border">
          <span className="text-muted">Balance</span>
          <span>{Number(formatUnits(balance, 6)).toFixed(2)} USDG</span>
        </div>

        {/* Simple Orderbook View */}
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-bold mb-3">Live Orderbook</h3>
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Side</span>
            <span>Price</span>
            <span>Shares</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {orderbookData?.orders?.length > 0 ? (
              orderbookData.orders.map((o: any) => (
                <div key={o.id} className="flex justify-between text-xs">
                  <span className={o.side === 'YES' ? 'text-yes' : 'text-no'}>
                    BUY {o.side}
                  </span>
                  <span>{Math.round(o.price * 100)} ¢</span>
                  <span>{Number(o.amount).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-center text-muted">No pending orders.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

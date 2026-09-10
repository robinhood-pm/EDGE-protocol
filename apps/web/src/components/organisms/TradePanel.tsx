"use client";

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Settings2, Loader2 } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { MarketDetail } from '@/types';

interface TradePanelProps {
  market: MarketDetail;
}

export function TradePanel({ market }: TradePanelProps) {
  const { address, isConnected } = useAccount();
  const [amountStr, setAmountStr] = useState<string>('5');
  const amountToSpend = parseUnits(amountStr || '0', 6);
  
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

      const order = {
        maker: address,
        marketId: BigInt(1), // Hardcoded for MVP
        outcome,
        amount: amountToSpend, // Number of shares (MVP hack)
        price: amountToSpend, // Total USDG cost
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
      alert("Order signed successfully! Next step: send to backend.");
      // TODO: send to backend
      
    } catch (e) {
      console.error("Signature failed", e);
    } finally {
      setIsSigning(false);
    }
  };

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
          <Button variant="yes" className="h-12 text-sm font-bold shadow-sm shadow-yes/20" onClick={() => setAmountStr('5')}>UP 36¢</Button>
          <Button variant="secondary" className="h-12 text-sm font-bold text-foreground" onClick={() => setAmountStr('5')}>DOWN 65¢</Button>
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
            variant="yes" 
            className="w-full mb-4 font-bold" 
            onClick={() => handleBuy(1)} 
            disabled={isSigning}
          >
            {isSigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Buy Order'}
          </Button>
        )}
        
        <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-border">
          <span className="text-muted">Balance</span>
          <span>{Number(formatUnits(balance, 6)).toFixed(2)} USDG</span>
        </div>
      </div>
    </div>
  );
}

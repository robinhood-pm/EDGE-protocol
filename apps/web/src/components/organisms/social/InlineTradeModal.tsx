"use client";

import React, { useState } from 'react';
import { Callout } from '@/types/social';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { X, Loader2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { logActivity } from '@/lib/logger';

interface InlineTradeModalProps {
  callout: Callout;
  initialSide: 'YES' | 'NO';
  isOpen: boolean;
  onClose: () => void;
}

export function InlineTradeModal({ callout, initialSide, isOpen, onClose }: InlineTradeModalProps) {
  const { address, isConnected } = useAccount();
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>(initialSide);
  const [amountStr, setAmountStr] = useState<string>('10');
  const [isSigning, setIsSigning] = useState(false);

  const amountToSpend = parseUnits(amountStr || '0', 6);
  const inputNum = Number(amountStr || '0');
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const chainIdEnv = process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID || '46630';

  // Read USDG Balance
  const { data: balanceData } = useReadContract({
    address: CONTRACT_ADDRESSES.USDG,
    abi: ABIS.ERC20,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isOpen },
  });

  const balance = balanceData ? (balanceData as bigint) : BigInt(0);
  const isInsufficient = balance < amountToSpend;

  // Read USDG Allowance for Exchange
  const { data: allowanceData } = useReadContract({
    address: CONTRACT_ADDRESSES.USDG,
    abi: ABIS.ERC20,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.Exchange] : undefined,
    query: { enabled: !!address && isOpen },
  });

  const allowance = allowanceData ? (allowanceData as bigint) : BigInt(0);
  const needsApproval = allowance < amountToSpend;

  // Write Contract (Approve)
  const { writeContract: approve, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isWaitingApprove } = useWaitForTransactionReceipt({ hash: approveTxHash });

  // Sign Order
  const { signTypedDataAsync } = useSignTypedData();

  if (!isOpen) return null;

  const currentProbability = callout.currentProbability || callout.market?.yesProbability || 50;
  const outcomeIndex = selectedSide === 'YES' ? 1 : 0;
  const priceNum = selectedSide === 'YES' ? currentProbability / 100 : (100 - currentProbability) / 100;
  const estimatedShares = inputNum > 0 && priceNum > 0 ? (inputNum / priceNum).toFixed(2) : '0';

  const handleApprove = () => {
    approve({
      address: CONTRACT_ADDRESSES.USDG,
      abi: ABIS.ERC20,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.Exchange, amountToSpend],
    });
  };

  const handleExecuteTrade = async () => {
    if (!address) return;
    try {
      setIsSigning(true);

      const domain = {
        name: 'EdgeProtocolExchange',
        version: '1',
        chainId: Number(chainIdEnv),
        verifyingContract: CONTRACT_ADDRESSES.Exchange as `0x${string}`,
      };

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
      };

      const marketIdStr = callout.market?.id || '1';
      const numericMarketId = BigInt(marketIdStr.replace(/\D/g, '') || '1');
      const priceContract = BigInt(Math.floor(priceNum * 1000000));
      const sharesContract = (BigInt(Math.floor(inputNum * 1000000)) * BigInt(1000000)) / priceContract;

      const order = {
        maker: address,
        marketId: numericMarketId,
        outcome: outcomeIndex,
        amount: sharesContract,
        price: priceContract,
        isBuy: true,
        nonce: BigInt(Math.floor(Math.random() * 1000000)),
        expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
      };

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Order',
        message: order,
      });

      const rawOrderForBackend = {
        maker: order.maker,
        marketId: order.marketId.toString(),
        outcome: order.outcome,
        amount: order.amount.toString(),
        price: order.price.toString(),
        isBuy: order.isBuy,
        nonce: order.nonce.toString(),
        expiration: order.expiration.toString(),
      };

      // Submit Order
      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: marketIdStr,
          wallet_address: address,
          side: selectedSide,
          order_type: 'LIMIT',
          amount: Number(formatUnits(sharesContract, 6)),
          price: priceNum,
          signature: signature,
          rawOrder: rawOrderForBackend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      // Record Callout Trade Attribution
      try {
        await fetch(`${backendUrl}/api/social/attribution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calloutId: callout.id,
            creatorId: callout.creator.handle,
            traderAddress: address,
            marketId: marketIdStr,
            volume: inputNum,
            network: 'testnet',
          }),
        });
      } catch (attrErr) {
        console.warn('Attribution recording warning:', attrErr);
      }

      toast.success(`Bought ${estimatedShares} ${selectedSide} shares directly from @${callout.creator.handle}'s callout!`);
      logActivity('INLINE_CALLOUT_TRADE', { calloutId: callout.id, side: selectedSide, amount: amountStr }, address);
      onClose();
    } catch (e: any) {
      console.error('Inline trade failed:', e);
      if (e.message?.includes('User rejected') || e.message?.includes('user rejected')) {
        toast.error('Trade rejected by wallet.');
      } else {
        toast.error(e.message || 'Failed to execute inline trade.');
      }
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0c0d12] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-yes/30 text-yes text-[10px]">
              INLINE CALLOUT TRADE
            </Badge>
            <span className="text-xs text-white/40 font-mono">@{callout.creator.handle}</span>
          </div>
          <h3 className="font-bold text-base text-white leading-snug">
            {callout.market?.title || callout.headline}
          </h3>
        </div>

        {/* Outcome Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedSide('YES')}
            className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${
              selectedSide === 'YES'
                ? 'bg-yes/20 border-yes text-yes shadow-lg shadow-yes/10'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            <span>BUY YES</span>
            <span className="font-mono text-xs">{currentProbability}%</span>
          </button>

          <button
            onClick={() => setSelectedSide('NO')}
            className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${
              selectedSide === 'NO'
                ? 'bg-no/20 border-no text-no shadow-lg shadow-no/10'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            <span>BUY NO</span>
            <span className="font-mono text-xs">{100 - currentProbability}%</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/60">
            <span>Amount (USDG)</span>
            <span>Balance: {formatUnits(balance, 6)} USDG</span>
          </div>

          <div className="relative">
            <input
              type="number"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-yes"
            />
            <span className="absolute right-4 top-3.5 text-xs text-white/40 font-bold">USDG</span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {['5', '10', '50', '100'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmountStr(val)}
                className={`py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                  amountStr === val
                    ? 'bg-white/20 border-white text-white font-bold'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1 text-xs">
          <div className="flex justify-between text-white/60">
            <span>Est. Shares:</span>
            <span className="font-bold text-white">{estimatedShares} {selectedSide}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Attributed Creator:</span>
            <span className="font-bold text-yes">@{callout.creator.handle}</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button onClick={openConnectModal} className="w-full font-bold">
                  Connect Wallet to Trade
                </Button>
              )}
            </ConnectButton.Custom>
          ) : needsApproval ? (
            <Button
              onClick={handleApprove}
              disabled={isApproving || isWaitingApprove}
              className="w-full font-bold"
            >
              {(isApproving || isWaitingApprove) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve USDG for Trading
            </Button>
          ) : (
            <Button
              onClick={handleExecuteTrade}
              disabled={isSigning || isInsufficient || inputNum <= 0}
              variant={selectedSide === 'YES' ? 'yes' : 'no'}
              className="w-full font-bold py-3 text-base gap-2"
            >
              {isSigning && <Loader2 className="w-5 h-5 animate-spin" />}
              {isInsufficient ? 'Insufficient Balance' : `Confirm Buy ${selectedSide}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

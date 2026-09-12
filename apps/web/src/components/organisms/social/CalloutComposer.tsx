"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Sparkles, Loader2, ShieldCheck, DollarSign, Wallet, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface CalloutComposerProps {
  onSuccess?: () => void;
}

interface UserPosition {
  id: string;
  market_id: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entry_price: string;
  margin: string;
  leverage: string;
  currentMarkPrice?: number | null;
  marketName?: string;
  status: string;
}

export function CalloutComposer({ onSuccess }: CalloutComposerProps) {
  const { address, isConnected } = useAccount();
  
  const [headline, setHeadline] = useState('');
  const [thesis, setThesis] = useState('');
  const [conviction, setConviction] = useState<'YES' | 'NO'>('YES');
  const [confidence, setConfidence] = useState<number>(75);
  const [category, setCategory] = useState<string>('crypto');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real user open positions fetched from API
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState<boolean>(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');

  // Fetch real positions when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      setPositions([]);
      setSelectedPositionId('');
      return;
    }

    const fetchUserPositions = async () => {
      setIsLoadingPositions(true);
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const backendUrl = rawApiUrl ? rawApiUrl : '';
        const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
        const network = rawNetwork ? rawNetwork : 'testnet';

        const res = await fetch(`${backendUrl}/api/perps/positions?network=${network}&trader=${address}`);
        if (!res.ok) throw new Error('Failed to fetch positions');
        
        const data = await res.json();
        if (data.success && Array.isArray(data.positions)) {
          setPositions(data.positions);
          if (data.positions.length > 0) {
            setSelectedPositionId(data.positions[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user open positions:', err);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    fetchUserPositions();
  }, [address, isConnected]);

  // Derived selected position object
  const selectedPosition = positions.find((p) => p.id === selectedPositionId) || positions[0];

  // Calculate real position values from selected position
  const getPositionMetrics = () => {
    if (!selectedPosition) return null;

    const sizeNum = parseFloat(selectedPosition.size) || 0;
    const entryNum = parseFloat(selectedPosition.entry_price) || 0;
    const markNum = selectedPosition.currentMarkPrice || entryNum;
    const leverageNum = parseFloat(selectedPosition.leverage) || 1;
    const marginNum = parseFloat(selectedPosition.margin) || 0;

    const notionalVal = sizeNum * markNum;
    const pnl = selectedPosition.side === 'LONG' 
      ? (markNum - entryNum) * sizeNum 
      : (entryNum - markNum) * sizeNum;

    return {
      marketId: selectedPosition.market_id,
      marketName: selectedPosition.marketName || selectedPosition.market_id,
      side: selectedPosition.side,
      leverage: leverageNum,
      margin: marginNum,
      notionalVal,
      pnl,
      positionValueStr: `$${notionalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      profitValueStr: `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  };

  const metrics = getPositionMetrics();

  // Auto-sync conviction with selected position side
  useEffect(() => {
    if (metrics) {
      setConviction(metrics.side === 'LONG' ? 'YES' : 'NO');
    }
  }, [selectedPositionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first to post a Callout');
      return;
    }

    if (!metrics || !selectedPosition) {
      toast.error('You must select an active open position to create a Callout with verified Skin in the Game');
      return;
    }

    if (!headline.trim()) {
      toast.error('Please enter a headline for your callout');
      return;
    }

    setIsSubmitting(true);

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
      const backendUrl = rawApiUrl ? rawApiUrl : '';
      const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
      const network = rawNetwork ? rawNetwork : 'testnet';

      const res = await fetch(`${backendUrl}/api/callouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: address.toLowerCase(),
          headline,
          thesis,
          category,
          conviction,
          confidence,
          marketId: metrics.marketId,
          callProbability: confidence,
          positionValue: metrics.positionValueStr,
          profitValue: metrics.profitValueStr,
          network,
        }),
      });

      if (!res.ok) {
        throw new Error('Backend publish failed');
      }

      toast.success('Callout & Real Open Position published successfully!');
      setHeadline('');
      setThesis('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish callout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If wallet is not connected, render mandatory wallet connection guard banner
  if (!isConnected) {
    return (
      <div className="bg-[#070709] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8 text-yes" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-white tracking-tight">Connect Wallet to Create Callout</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Edge Protocol requires connected Web3 wallet and verified real open positions to post Callouts with transparent Skin in the Game.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#070709] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yes" />
          <h2 className="text-lg font-bold text-white">Create a Verified Callout</h2>
        </div>
        <Badge variant="secondary" className="bg-yes/10 text-yes border-yes/20">
          Skin in the Game Verified
        </Badge>
      </div>

      {/* Real Open Positions Selection Section */}
      <div className="bg-[#11131c] border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Select Real Open Position *</span>
          </label>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            REAL ON-CHAIN DATA
          </Badge>
        </div>

        {isLoadingPositions ? (
          <div className="flex items-center justify-center py-6 text-white/50 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Fetching user open positions...</span>
          </div>
        ) : positions.length === 0 ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>No Active Open Positions Found</span>
            </div>
            <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
              You must have an active open position in Perps Trading before posting a Callout. Dummy or fake positions are strictly prohibited.
            </p>
            <Link href="/perps" className="inline-block">
              <Button type="button" className="bg-yes text-black font-bold text-xs h-9 px-4 rounded-lg hover:bg-yes/90">
                Open a Perp Position Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedPositionId}
              onChange={(e) => setSelectedPositionId(e.target.value)}
              className="w-full bg-[#151924] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yes text-sm font-medium"
            >
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.marketName || pos.market_id} — {pos.side} {pos.leverage}x (Size: {pos.size}, Entry: ${pos.entry_price})
                </option>
              ))}
            </select>

            {/* Selected Position Live Card Preview */}
            {metrics && (
              <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">Market:</span>
                    <span className="font-bold text-white">{metrics.marketName}</span>
                  </div>
                  <Badge className={metrics.side === 'LONG' ? 'bg-yes/20 text-yes border-yes/30' : 'bg-no/20 text-no border-no/30'}>
                    {metrics.side} {metrics.leverage}x
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Position Value</span>
                    <span className="font-bold text-white text-sm">{metrics.positionValueStr}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">Unrealized PnL</span>
                    <span className={`font-bold text-sm ${metrics.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {metrics.profitValueStr}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Headline */}
      <div>
        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
          Callout Headline *
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. BTC breaks $150K before year end..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-yes focus:ring-1 focus:ring-yes transition-all font-medium text-sm"
          maxLength={120}
        />
      </div>

      {/* Conviction & Confidence */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            Conviction
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={conviction === 'YES' ? 'yes' : 'outline'}
              onClick={() => setConviction('YES')}
              className="w-full text-xs font-bold h-10"
            >
              YES CALL
            </Button>
            <Button
              type="button"
              variant={conviction === 'NO' ? 'no' : 'outline'}
              onClick={() => setConviction('NO')}
              className="w-full text-xs font-bold h-10"
            >
              NO CALL
            </Button>
          </div>
        </div>

        {/* Confidence Slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
            <span>Confidence</span>
            <span className="text-white font-mono">{confidence}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={99}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-yes cursor-pointer"
          />
        </div>
      </div>

      {/* Thesis */}
      <div>
        <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
          Thesis / Reasoning (Optional)
        </label>
        <textarea
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          rows={3}
          placeholder="Share your technical analysis, macro data, or logic behind this prediction..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-yes focus:ring-1 focus:ring-yes transition-all text-sm leading-relaxed"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || !headline.trim() || positions.length === 0}
        className="w-full bg-white text-black hover:bg-white/90 font-bold h-11 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          'Publish Callout with Real Position'
        )}
      </Button>
    </form>
  );
}


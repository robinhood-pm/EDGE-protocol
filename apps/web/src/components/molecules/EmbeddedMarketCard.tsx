"use client";

import React from 'react';
import Link from 'next/link';
import { CalloutMarket } from '@/types/social';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface EmbeddedMarketCardProps {
  market: CalloutMarket;
  callProbability: number;
  currentProbability: number;
  hideProbabilityBar?: boolean;
}

export function EmbeddedMarketCard({
  market,
  callProbability,
  currentProbability,
  hideProbabilityBar = false,
}: EmbeddedMarketCardProps) {
  const probDiff = currentProbability - callProbability;
  const isPositiveShift = probDiff >= 0;

  const positionVal = market.positionValue || `$${(callProbability * 4.85 + 50).toFixed(2)}`;
  const rawProfit = probDiff * 12.4;
  const profitVal = market.profitValue || (rawProfit >= 0 ? `+$${rawProfit.toFixed(2)}` : `-$${Math.abs(rawProfit).toFixed(2)}`);

  return (
    <Link
      href={`/market/${market.id}`}
      className="block group my-3 bg-[#111218] hover:bg-[#161822] border border-white/10 hover:border-white/20 rounded-xl p-3.5 transition-all shadow-md relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Market Logo & Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
            <img src={market.image} alt={market.title} className="w-5 h-5 object-contain" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-white truncate group-hover:text-white/90">
              {market.title}
            </h4>
            <span className="text-[10px] text-white/40 block truncate">
              {market.totalVolume ? `$${(market.totalVolume / 1000).toFixed(1)}K Vol` : 'Prediction Market'}
            </span>
          </div>
        </div>

        {/* Middle Column: Position */}
        <div className="text-right flex-shrink-0">
          <span className="text-[10px] text-white/40 block font-medium">Position</span>
          <span className="font-bold text-xs text-white font-mono">{positionVal}</span>
        </div>

        {/* Right Column: Profit */}
        <div className="text-right flex-shrink-0">
          <span className="text-[10px] text-white/40 block font-medium">Profit</span>
          <span className={`font-bold text-xs font-mono ${profitVal.startsWith('+') ? 'text-emerald-400' : 'text-no'}`}>
            {profitVal}
          </span>
        </div>
      </div>

      {/* Probability Bar (Hidden if hideProbabilityBar is true) */}
      {!hideProbabilityBar && (
        <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-white/50">Called: <strong className="text-white">{callProbability}%</strong></span>
            <span className="text-white/50">Now: <strong className="text-white font-mono">{currentProbability}%</strong></span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
            <div className="h-full bg-yes transition-all duration-500" style={{ width: `${currentProbability}%` }} />
            <div className="h-full bg-no transition-all duration-500" style={{ width: `${100 - currentProbability}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}

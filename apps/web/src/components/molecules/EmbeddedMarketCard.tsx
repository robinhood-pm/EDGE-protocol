"use client";

import React from 'react';
import Link from 'next/link';
import { CalloutMarket } from '@/types/social';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface EmbeddedMarketCardProps {
  market: CalloutMarket;
  callProbability: number;
  currentProbability: number;
}

export function EmbeddedMarketCard({ market, callProbability, currentProbability }: EmbeddedMarketCardProps) {
  const probDiff = currentProbability - callProbability;
  const isPositiveShift = probDiff >= 0;

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol}`;
  };

  return (
    <Link
      href={`/market/${market.id}`}
      className="block group my-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl p-3.5 transition-all shadow-inner relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
            <img src={market.image} alt={market.title} className="w-5 h-5 object-contain" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white group-hover:text-white/90 line-clamp-1">
              {market.title}
            </h4>
            <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
              <span>{formatVolume(market.totalVolume)} Vol</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Market
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-white/50 group-hover:text-white transition-colors">
          <span>Trade</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Probability Comparison */}
      <div className="space-y-1.5 pt-2 border-t border-white/5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-white/60">
            Called at <strong className="text-white">{callProbability}%</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-white/60">Now:</span>
            <strong className="text-white font-mono text-sm">{currentProbability}%</strong>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded font-mono ${isPositiveShift ? 'bg-emerald-500/20 text-emerald-400' : 'bg-no/20 text-no'}`}>
              {isPositiveShift ? `+${probDiff.toFixed(1)}%` : `${probDiff.toFixed(1)}%`}
            </span>
          </span>
        </div>

        {/* Live Bar */}
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-full bg-yes transition-all duration-500" style={{ width: `${currentProbability}%` }} />
          <div className="h-full bg-no transition-all duration-500" style={{ width: `${100 - currentProbability}%` }} />
        </div>
      </div>
    </Link>
  );
}

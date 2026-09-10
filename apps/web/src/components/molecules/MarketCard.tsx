import React from 'react';
import Link from 'next/link';
import { Link2, Star } from 'lucide-react';
import { Market } from '@/types';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol}`;
  };

  return (
    <Link href={`/market/${market.slug || market.id}`} className="block group h-full focus:outline-none focus:ring-1 focus:ring-white/20 rounded-2xl">
      <div className="relative bg-[#070709] rounded-2xl border border-white/10 overflow-hidden hover:border-white/30 transition-colors cursor-pointer h-full flex flex-col">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm group-hover:scale-110 group-hover:opacity-60 transition-all duration-500"
          style={{ backgroundImage: `url(${market.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-[#070709]/20" />

        {/* Card Content */}
        <div className="relative z-10 p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg backdrop-blur-md">
                <img src={market.image} alt={market.title} className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 text-white group-hover:text-white/80 transition-colors">
                  {market.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 text-white/50 hover:text-white rounded-md hover:bg-white/10">
                <Link2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-white/50 hover:text-white rounded-md hover:bg-white/10">
                <Star className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Options / Probabilities */}
          {market.options ? (
            <div className="flex-1 flex flex-col gap-2 mb-4">
              {market.options.map((opt, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{opt.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{opt.yesProbability ?? opt.probability}%</span>
                    <div className="flex gap-1">
                      <div className="bg-yes/20 text-yes px-2 py-0.5 rounded text-xs font-semibold">YES</div>
                      <div className="bg-no/20 text-no px-2 py-0.5 rounded text-xs font-semibold">NO</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end mb-4">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-yes flex items-center gap-1">
                  <span className="text-xs">▲</span> {market.yesProbability}%
                </span>
                <span className="text-no flex items-center gap-1">
                  {market.noProbability}% <span className="text-xs">▼</span>
                </span>
              </div>
              {/* Probability Bar */}
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex mb-4 backdrop-blur-sm">
                <div className="h-full bg-yes" style={{ width: `${market.yesProbability}%` }} />
                <div className="h-full bg-black/40 w-1" />
                <div className="h-full bg-no" style={{ width: `${market.noProbability}%` }} />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="yes" className="w-full text-xs h-9">UP {market.yesPrice}¢</Button>
                <Button variant="no" className="w-full text-xs h-9">DOWN {market.noPrice}¢</Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 flex items-center justify-between text-xs text-white/50 border-t border-white/10">
            <div className="flex items-center gap-1">
              <Badge variant="muted" className="px-1.5 text-[10px] bg-white/5 border-white/10 text-white/70">
                <span className="text-yellow-500 mr-1">PP</span> ★★★★★
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatVolume(market.totalVolume)} Vol</span>
              {market.status === 'Live' && (
                <span className="flex items-center gap-1 text-red-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

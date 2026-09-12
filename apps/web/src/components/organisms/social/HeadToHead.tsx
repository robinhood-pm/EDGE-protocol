"use client";

import React from 'react';
import { Callout } from '@/types/social';
import { Badge } from '@/components/atoms/Badge';
import { Swords, ArrowUpRight, Flame } from 'lucide-react';
import Link from 'next/link';

interface HeadToHeadProps {
  calloutA: Callout;
  calloutB: Callout;
}

export function HeadToHead({ calloutA, calloutB }: HeadToHeadProps) {
  return (
    <div className="bg-[#070709] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-no/30 text-no text-[10px]">
            HEAD TO HEAD RIVALRY
          </Badge>
          <span className="text-xs text-white/40 font-mono">2 OPPOSING CALLS</span>
        </div>
        <Swords className="w-5 h-5 text-no animate-pulse" />
      </div>

      <h3 className="font-bold text-base text-white text-center">
        {calloutA.market?.title || calloutA.headline}
      </h3>

      {/* Side-by-side rivalry cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Creator A */}
        <div className="bg-[#0c0d14] border border-yes/30 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={calloutA.creator.avatarUrl} alt={calloutA.creator.handle} className="w-8 h-8 rounded-full border border-yes/40" />
              <div>
                <span className="font-bold text-xs text-white block">@{calloutA.creator.handle}</span>
                <span className="text-[10px] text-yes font-mono">YES CONVICTION</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] bg-yes/20 text-yes border-yes/30">
              {calloutA.confidence}% CONF
            </Badge>
          </div>
          {calloutA.thesis && <p className="text-xs text-white/80 leading-relaxed italic">"{calloutA.thesis}"</p>}
          <div className="flex justify-between text-[11px] font-mono text-white/50 pt-2 border-t border-white/5">
            <span>Called at:</span>
            <span className="text-yes font-bold">{calloutA.callProbability}%</span>
          </div>
        </div>

        {/* Creator B */}
        <div className="bg-[#0c0d14] border border-no/30 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={calloutB.creator.avatarUrl} alt={calloutB.creator.handle} className="w-8 h-8 rounded-full border border-no/40" />
              <div>
                <span className="font-bold text-xs text-white block">@{calloutB.creator.handle}</span>
                <span className="text-[10px] text-no font-mono">NO CONVICTION</span>
              </div>
            </div>
            <Badge variant="destructive" className="text-[10px] bg-no/20 text-no border-no/30">
              {calloutB.confidence}% CONF
            </Badge>
          </div>
          {calloutB.thesis && <p className="text-xs text-white/80 leading-relaxed italic">"{calloutB.thesis}"</p>}
          <div className="flex justify-between text-[11px] font-mono text-white/50 pt-2 border-t border-white/5">
            <span>Called at:</span>
            <span className="text-no font-bold">{calloutB.callProbability}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

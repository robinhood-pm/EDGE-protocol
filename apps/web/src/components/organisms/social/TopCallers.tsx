"use client";

import React from 'react';
import Link from 'next/link';
import staticCreators from '@/data/creators.json';
import { Trophy, CheckCircle2, ChevronRight } from 'lucide-react';
import { FollowButton } from '@/components/molecules/FollowButton';

export function TopCallers() {
  const topCreators = staticCreators.slice(0, 5);

  return (
    <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">Top Prediction Callers</h3>
        </div>
        <Link href="/leaderboard" className="text-xs text-yes hover:underline flex items-center gap-0.5">
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {topCreators.map((creator, i) => (
          <div key={creator.id} className="flex items-center justify-between gap-3 text-xs">
            <Link href={`/profile/${creator.handle}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
              <span className="font-mono font-bold text-white/40 w-4">{i + 1}</span>
              <img src={creator.avatarUrl} alt={creator.displayName} className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white group-hover:text-yes transition-colors truncate flex items-center gap-1">
                  <span>{creator.displayName}</span>
                  {creator.isVerified && <CheckCircle2 className="w-3 h-3 text-yes fill-yes/20" />}
                </div>
                <div className="text-white/40 font-mono text-[11px]">
                  {creator.stats.edgeScore} pts • {creator.stats.accuracy}% acc
                </div>
              </div>
            </Link>

            <FollowButton creatorId={creator.id} size="sm" className="h-7 text-[11px] px-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

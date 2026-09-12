"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, CheckCircle2, ChevronRight } from 'lucide-react';
import { FollowButton } from '@/components/molecules/FollowButton';

export interface TopCallerDTO {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  edgeScore: number;
  accuracy: number;
}

export function TopCallers() {
  const [topCreators, setTopCreators] = useState<TopCallerDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTopCallers() {
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/api/leaderboard?period=all_time&network=testnet`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.leaderboard)) {
            const mapped: TopCallerDTO[] = data.leaderboard.slice(0, 5).map((item: any) => ({
              id: item.profileId || item.handle,
              handle: item.handle,
              displayName: item.displayName || item.handle,
              avatarUrl: item.avatarUrl,
              isVerified: Boolean(item.isVerified),
              edgeScore: Number(item.edgeScore || 0),
              accuracy: Number(item.accuracy || 0),
            }));
            setTopCreators(mapped);
          }
        }
      } catch (err) {
        console.error('Error fetching top prediction callers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopCallers();
  }, []);

  if (!isLoading && topCreators.length === 0) {
    return null;
  }

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

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-4 h-4 bg-white/10 rounded" />
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 bg-white/10 rounded w-24" />
                  <div className="h-2.5 bg-white/5 rounded w-16" />
                </div>
              </div>
              <div className="w-16 h-7 bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {topCreators.map((creator, i) => (
            <div key={creator.id || creator.handle} className="flex items-center justify-between gap-3 text-xs">
              <Link href={`/profile/${creator.handle}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                <span className="font-mono font-bold text-white/40 w-4">{i + 1}</span>
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white group-hover:text-yes transition-colors truncate flex items-center gap-1">
                    <span>{creator.displayName}</span>
                    {creator.isVerified && <CheckCircle2 className="w-3 h-3 text-yes fill-yes/20" />}
                  </div>
                  <div className="text-white/40 font-mono text-[11px]">
                    {creator.edgeScore} pts • {creator.accuracy}% acc
                  </div>
                </div>
              </Link>

              <FollowButton creatorId={creator.id} size="sm" className="h-7 text-[11px] px-3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

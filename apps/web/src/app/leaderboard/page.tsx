"use client";

import React, { useState } from 'react';
import { Header } from '@/components/organisms/Header';
import { Badge } from '@/components/atoms/Badge';
import { LeaderboardEntry } from '@/types/social';
import staticLeaderboard from '@/data/leaderboard.json';
import { Trophy, Target, TrendingUp, Zap, ShieldCheck, CheckCircle2, Crown } from 'lucide-react';
import Link from 'next/link';

type PeriodType = '24h' | '7d' | '30d' | 'all_time';

export default function LeaderboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('24h');

  const entries: LeaderboardEntry[] = (staticLeaderboard.periods as any)[selectedPeriod] || staticLeaderboard.periods['24h'];

  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  const formatVolume = (volStr: string) => {
    const vol = Number(volStr || 0);
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />

      <main className="flex-1 container max-w-screen-lg mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-400/30 text-amber-400 text-[10px]">
                PROPHETS & CALLERS RANKING
              </Badge>
              <Badge variant="outline" className="text-white/40 text-[10px]">
                TESTNET
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>Leaderboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/50">
              Top prediction creators ranked by Edge Score and verified accuracy. Min 10 resolved callouts.
            </p>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl self-start sm:self-auto">
            {(['24h', '7d', '30d', 'all_time'] as PeriodType[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  selectedPeriod === period
                    ? 'bg-yes text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {period === 'all_time' ? 'All Time' : period}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Highlights (Top 3) */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
            {/* #2 Rank */}
            {top2 && (
              <div className="bg-[#070709] border border-white/10 hover:border-white/20 rounded-2xl p-5 text-center space-y-3 relative group shadow-xl">
                <div className="w-10 h-10 rounded-full bg-slate-300/20 border border-slate-300/40 text-slate-300 font-black text-sm flex items-center justify-center mx-auto">
                  #2
                </div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto border-2 border-slate-300/30">
                  <img src={top2.avatarUrl} alt={top2.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <Link href={`/profile/${top2.handle}`} className="font-bold text-base text-white hover:text-yes transition-colors">
                    {top2.displayName}
                  </Link>
                  <p className="text-xs text-white/40 font-mono">@{top2.handle}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 flex justify-around text-xs">
                  <div>
                    <div className="text-[10px] text-white/40">Edge Score</div>
                    <div className="font-bold text-amber-400">{top2.edgeScore} pts</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40">Accuracy</div>
                    <div className="font-bold text-emerald-400">{top2.accuracy}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* #1 Rank (Center Podium) */}
            {top1 && (
              <div className="bg-[#0c0d14] border-2 border-amber-400/40 rounded-2xl p-6 text-center space-y-3 relative group shadow-2xl scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg">
                  <Crown className="w-3.5 h-3.5" />
                  <span>#1 PROPHET</span>
                </div>
                <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-amber-400/60 shadow-lg shadow-amber-400/10">
                  <img src={top1.avatarUrl} alt={top1.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <Link href={`/profile/${top1.handle}`} className="font-extrabold text-lg text-white hover:text-amber-300 transition-colors">
                    {top1.displayName}
                  </Link>
                  <p className="text-xs text-white/50 font-mono">@{top1.handle}</p>
                </div>
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 flex justify-around text-xs">
                  <div>
                    <div className="text-[10px] text-amber-300/60">Edge Score</div>
                    <div className="font-black text-amber-400 text-base">{top1.edgeScore} pts</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-300/60">Accuracy</div>
                    <div className="font-black text-emerald-400 text-base">{top1.accuracy}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* #3 Rank */}
            {top3 && (
              <div className="bg-[#070709] border border-white/10 hover:border-white/20 rounded-2xl p-5 text-center space-y-3 relative group shadow-xl">
                <div className="w-10 h-10 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-500 font-black text-sm flex items-center justify-center mx-auto">
                  #3
                </div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto border-2 border-amber-700/30">
                  <img src={top3.avatarUrl} alt={top3.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <Link href={`/profile/${top3.handle}`} className="font-bold text-base text-white hover:text-yes transition-colors">
                    {top3.displayName}
                  </Link>
                  <p className="text-xs text-white/40 font-mono">@{top3.handle}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 flex justify-around text-xs">
                  <div>
                    <div className="text-[10px] text-white/40">Edge Score</div>
                    <div className="font-bold text-amber-400">{top3.edgeScore} pts</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40">Accuracy</div>
                    <div className="font-bold text-emerald-400">{top3.accuracy}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="bg-[#070709] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Full Creator Rankings</h3>
            <span className="text-xs text-white/40 font-mono">{entries.length} creators</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Creator</th>
                  <th className="px-6 py-3">Edge Score</th>
                  <th className="px-6 py-3">Accuracy</th>
                  <th className="px-6 py-3">Resolved Calls</th>
                  <th className="px-6 py-3 text-right">Attributed Vol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <tr key={entry.profileId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-extrabold text-sm">
                      {entry.rank === 1 ? (
                        <span className="text-amber-400">#1 👑</span>
                      ) : entry.rank === 2 ? (
                        <span className="text-slate-300">#2</span>
                      ) : entry.rank === 3 ? (
                        <span className="text-amber-600">#3</span>
                      ) : (
                        <span className="text-white/40">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/profile/${entry.handle}`} className="flex items-center gap-3 group">
                        <img src={entry.avatarUrl} alt={entry.displayName} className="w-8 h-8 rounded-full border border-white/10" />
                        <div>
                          <div className="font-bold text-white group-hover:text-yes transition-colors flex items-center gap-1">
                            <span>{entry.displayName}</span>
                            {entry.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-yes fill-yes/20" />}
                          </div>
                          <span className="text-white/40 font-mono">@{entry.handle}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-amber-400 text-sm">
                      {entry.edgeScore} pts
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {entry.accuracy}%
                    </td>
                    <td className="px-6 py-4 font-mono text-white/70">
                      {entry.resolvedCalls} calls
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-purple-300">
                      {formatVolume(entry.volumeAttributed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

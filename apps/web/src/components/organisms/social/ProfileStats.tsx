"use client";

import React from 'react';
import { ProfileStats as ProfileStatsType } from '@/types/social';
import { Trophy, Target, Zap, Flame, TrendingUp } from 'lucide-react';
import { formatCompactVolume } from '@/lib/utils';

interface ProfileStatsProps {
  stats: ProfileStatsType;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const volumeStr = formatCompactVolume(stats.volumeAttributed);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Edge Score */}
      <div className="bg-[#070709] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-white/50 text-xs font-medium mb-2">
          <span>Edge Score</span>
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-amber-400 tracking-tight">{stats.edgeScore}</span>
          <span className="text-xs text-white/40 font-medium">pts</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-300" />
      </div>

      {/* Accuracy */}
      <div className="bg-[#070709] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-white/50 text-xs font-medium mb-2">
          <span>Accuracy</span>
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-400 tracking-tight">{stats.accuracy}%</span>
          <span className="text-xs text-white/40">({stats.correctCalls}/{stats.resolvedCalls})</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Total Calls */}
      <div className="bg-[#070709] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-white/50 text-xs font-medium mb-2">
          <span>Total Calls</span>
          <Zap className="w-4 h-4 text-yes" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white tracking-tight">{stats.totalCalls}</span>
          <span className="text-xs text-white/40">({stats.resolvedCalls} resolved)</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yes" />
      </div>

      {/* Current Streak */}
      <div className="bg-[#070709] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-white/50 text-xs font-medium mb-2">
          <span>Win Streak</span>
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-orange-500 tracking-tight">{stats.currentStreak} 🔥</span>
          <span className="text-xs text-white/40">Best: {stats.bestStreak}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
      </div>

      {/* Attributed Volume */}
      <div className="col-span-2 sm:col-span-1 bg-[#070709] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between text-white/50 text-xs font-medium mb-2">
          <span>Attributed Vol</span>
          <TrendingUp className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-purple-300 tracking-tight">{volumeStr}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
      </div>
    </div>
  );
}

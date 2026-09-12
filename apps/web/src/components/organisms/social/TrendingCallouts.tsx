"use client";

import React from 'react';
import Link from 'next/link';
import staticCallouts from '@/data/callouts.json';
import { Flame, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';

export function TrendingCallouts() {
  const trending = staticCallouts.slice(0, 3);

  return (
    <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="font-bold text-sm text-white">Trending Callouts</h3>
      </div>

      <div className="space-y-3">
        {trending.map((c) => (
          <Link
            key={c.id}
            href={`/callouts/${c.id}`}
            className="block group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 rounded-xl p-3 transition-all"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-white/50 font-mono">@{c.creator.handle}</span>
              <Badge variant={c.conviction === 'YES' ? 'secondary' : 'destructive'} className="text-[10px]">
                {c.conviction} ({c.confidence}%)
              </Badge>
            </div>
            <h4 className="font-semibold text-xs text-white group-hover:text-yes line-clamp-2 leading-snug">
              {c.headline}
            </h4>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
              <span>{c.metrics.views} views</span>
              <span>{c.metrics.likes} likes</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

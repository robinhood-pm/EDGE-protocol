"use client";

import React from 'react';
import Link from 'next/link';
import staticCallouts from '@/data/callouts.json';
import { Flame, TrendingUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { CalloutCard } from '@/components/organisms/social/CalloutCard';
import { Callout } from '@/types/social';

export function TrendingCallouts() {
  const trending = (staticCallouts as unknown as Callout[]).slice(0, 3);

  return (
    <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar sticky top-24">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-sm text-white">Trending Callouts</h3>
        </div>
        <Link href="/callouts" className="text-xs text-yes font-bold hover:underline inline-flex items-center gap-1">
          <span>View Feed</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {trending.map((callout) => (
          <CalloutCard key={callout.id} callout={callout} isCompact={true} />
        ))}
      </div>
    </div>
  );
}

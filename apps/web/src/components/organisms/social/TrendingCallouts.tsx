"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { CalloutCard } from '@/components/organisms/social/CalloutCard';
import { Callout } from '@/types/social';

const RecentCalloutSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-[#0c0d12] border border-white/5 rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10" />
            <div className="space-y-1.5">
              <div className="w-24 h-3 bg-white/10 rounded" />
              <div className="w-14 h-2 bg-white/5 rounded" />
            </div>
          </div>
          <div className="w-12 h-5 bg-white/5 rounded-md" />
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-3.5 bg-white/10 rounded" />
          <div className="w-3/4 h-3.5 bg-white/10 rounded" />
        </div>
        <div className="bg-[#111218] border border-white/5 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-white/10" />
            <div className="w-28 h-3 bg-white/10 rounded" />
          </div>
          <div className="w-12 h-3 bg-white/10 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export function TrendingCallouts() {
  const [recentCallouts, setRecentCallouts] = useState<Callout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecentCallouts = async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const backendUrl = rawApiUrl ? rawApiUrl : '';
        const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
        const network = rawNetwork ? rawNetwork : 'testnet';

        const res = await fetch(`${backendUrl}/api/callouts?network=${network}&limit=4`);
        if (!res.ok) throw new Error('Failed to fetch recent callouts');
        
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.callouts)) {
          setRecentCallouts(data.callouts.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching recent callouts:', err);
      } finally {
        if (isMounted && !silent) {
          setIsLoading(false);
        }
      }
    };

    fetchRecentCallouts(false);

    // Real-time polling every 6 seconds to show fresh callouts live
    const interval = setInterval(() => {
      fetchRecentCallouts(true);
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isLoading && recentCallouts.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar sticky top-24">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">Recent Callouts</h3>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <Link href="/callouts" className="text-xs text-yes font-bold hover:underline inline-flex items-center gap-1">
          <span>View Feed</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <RecentCalloutSkeleton />
        ) : (
          recentCallouts.map((callout) => (
            <CalloutCard key={callout.id} callout={callout} isCompact={true} />
          ))
        )}
      </div>
    </div>
  );
}


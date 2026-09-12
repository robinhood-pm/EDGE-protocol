"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Loader2 } from 'lucide-react';
import { CalloutCard } from '@/components/organisms/social/CalloutCard';
import { Callout } from '@/types/social';

const TrendingCalloutSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
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
  const [trending, setTrending] = useState<Callout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTrendingCallouts = async () => {
      setIsLoading(true);
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const backendUrl = rawApiUrl ? rawApiUrl : '';
        const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
        const network = rawNetwork ? rawNetwork : 'testnet';

        const res = await fetch(`${backendUrl}/api/callouts?network=${network}&limit=3`);
        if (!res.ok) throw new Error('Failed to fetch trending callouts');
        
        const data = await res.json();
        if (data.success && Array.isArray(data.callouts)) {
          setTrending(data.callouts.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching trending callouts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingCallouts();
  }, []);

  if (!isLoading && trending.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar sticky top-24">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          <h3 className="font-bold text-sm text-white">Trending Callouts</h3>
        </div>
        <Link href="/callouts" className="text-xs text-yes font-bold hover:underline inline-flex items-center gap-1">
          <span>View Feed</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <TrendingCalloutSkeleton />
        ) : (
          trending.map((callout) => (
            <CalloutCard key={callout.id} callout={callout} isCompact={true} />
          ))
        )}
      </div>
    </div>
  );
}


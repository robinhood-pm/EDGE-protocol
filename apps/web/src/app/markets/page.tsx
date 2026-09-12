"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/organisms/Header';
import { CategoryTabs } from '@/components/organisms/CategoryTabs';
import { MarketCard } from '@/components/molecules/MarketCard';
import { Market } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3 } from 'lucide-react';

import { TrendingCallouts } from '@/components/organisms/social/TrendingCallouts';
import { TopCallers } from '@/components/organisms/social/TopCallers';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [hasSidebarData, setHasSidebarData] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ['markets', activeCategory],
    queryFn: async () => {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const isDynamicFilter = ['Trending', 'Live', 'New'].includes(activeCategory);
      const queryParam = isDynamicFilter ? `filter=${activeCategory}` : `category=${activeCategory}`;
      
      const res = await fetch(`${backendUrl}/api/markets?${queryParam}`);
      if (!res.ok) throw new Error('Failed to fetch markets');
      return await res.json();
    }
  });

  const markets = (data?.markets as Market[]) || [];
  const liveCount = data?.liveCount || 0;

  useEffect(() => {
    async function checkSidebar() {
      try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const backendUrl = rawApiUrl ? rawApiUrl : '';
        const rawNetwork = process.env.NEXT_PUBLIC_NETWORK || 'testnet';

        const [leaderboardRes, calloutsRes] = await Promise.allSettled([
          fetch(`${backendUrl}/api/leaderboard?period=all_time&network=${rawNetwork}`),
          fetch(`${backendUrl}/api/callouts?network=${rawNetwork}&limit=3`),
        ]);

        let hasCallers = false;
        let hasCallouts = false;

        if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value.ok) {
          const lbData = await leaderboardRes.value.json();
          if (lbData.success && Array.isArray(lbData.leaderboard) && lbData.leaderboard.length > 0) {
            hasCallers = true;
          }
        }

        if (calloutsRes.status === 'fulfilled' && calloutsRes.value.ok) {
          const coData = await calloutsRes.value.json();
          if (coData.success && Array.isArray(coData.callouts) && coData.callouts.length > 0) {
            hasCallouts = true;
          }
        }

        setHasSidebarData(hasCallers || hasCallouts);
      } catch (err) {
        setHasSidebarData(false);
      }
    }

    checkSidebar();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />
      <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} liveCount={liveCount} />
      
      <main className="flex-1 container max-w-screen-2xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Markets Area */}
          <div className="flex-1">
            {isLoading ? (
              <div className={`grid gap-4 ${hasSidebarData ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'}`}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 h-[320px] overflow-hidden flex flex-col relative animate-pulse">
                    {/* Header/Image skeleton */}
                    <div className="h-32 bg-white/10 w-full" />
                    {/* Content skeleton */}
                    <div className="p-4 flex-1 flex flex-col gap-4">
                      <div className="h-6 bg-white/10 rounded w-5/6" />
                      <div className="h-4 bg-white/10 rounded w-4/6" />
                      <div className="flex gap-2 mt-2">
                        <div className="h-5 bg-white/10 rounded w-16" />
                        <div className="h-5 bg-white/10 rounded w-20" />
                      </div>
                      {/* Buttons skeleton */}
                      <div className="mt-auto flex gap-2">
                        <div className="h-10 bg-white/10 rounded flex-1" />
                        <div className="h-10 bg-white/10 rounded flex-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : markets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-border border-dashed rounded-2xl bg-white/5">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-muted">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Markets Available</h3>
                <p className="text-muted text-sm max-w-sm mx-auto mb-6">
                  There are currently no active prediction markets in this category.
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 ${hasSidebarData ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'}`}>
                {markets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </div>

          {/* Social Prediction Sidebar */}
          {hasSidebarData && (
            <div className="w-full lg:w-[380px] flex-shrink-0 space-y-6">
              <TopCallers />
              <TrendingCallouts />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

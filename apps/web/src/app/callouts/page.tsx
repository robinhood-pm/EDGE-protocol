"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { CategoryTabs } from '@/components/organisms/CategoryTabs';
import { CalloutCard } from '@/components/organisms/social/CalloutCard';
import { TopCallers } from '@/components/organisms/social/TopCallers';
import { TrendingCallouts } from '@/components/organisms/social/TrendingCallouts';
import { CounterCallModal } from '@/components/organisms/social/CounterCallModal';
import { Callout } from '@/types/social';
import staticCallouts from '@/data/callouts.json';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Plus, Flame, Users, Filter, Sparkles } from 'lucide-react';

export default function SocialFeedPage() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [activeCategory, setActiveCategory] = useState<string>('Trending');
  const [subFilter, setSubFilter] = useState<'all' | 'yes' | 'no' | 'high-confidence'>('all');
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [selectedCalloutForCounter, setSelectedCalloutForCounter] = useState<Callout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const network = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
    const endpoint =
      activeTab === 'following'
        ? `${backendUrl}/api/feed/following?userId=current-user&network=${network}`
        : `${backendUrl}/api/feed/for-you?category=${activeCategory}&network=${network}`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.callouts) && data.callouts.length > 0) {
          setCallouts(data.callouts);
        } else {
          throw new Error('Empty feed');
        }
      })
      .catch(() => {
        // Render from static callouts data if API is offline
        let list = staticCallouts as unknown as Callout[];
        if (activeCategory !== 'Trending' && activeCategory !== 'Live' && activeCategory !== 'New') {
          list = list.filter((c) => c.category.toLowerCase() === activeCategory.toLowerCase());
        }
        setCallouts(list);
      })
      .finally(() => setIsLoading(false));
  }, [activeTab, activeCategory]);

  // Apply sub-filter
  const filteredCallouts = callouts.filter((c) => {
    if (subFilter === 'yes') return c.conviction === 'YES';
    if (subFilter === 'no') return c.conviction === 'NO';
    if (subFilter === 'high-confidence') return c.confidence >= 80;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />

      {/* Category Tabs Bar */}
      <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} liveCount={callouts.length} />

      <main className="flex-1 container max-w-screen-2xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed Column */}
          <div className="flex-1 space-y-6">
            {/* Top Bar: Feed Tabs + Create Callout CTA */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab('for-you')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'for-you' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Callouts</span>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'following' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Following</span>
                </button>
              </div>

              <Link href="/callouts/create">
                <Button className="font-bold gap-2 bg-yes hover:bg-yes-hover text-white rounded-xl shadow-lg">
                  <Plus className="w-4 h-4" />
                  <span>Post Callout</span>
                </Button>
              </Link>
            </div>

            {/* Sub-filters Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs text-white/40 flex items-center gap-1 font-medium mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                onClick={() => setSubFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subFilter === 'all' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                All Calls
              </button>
              <button
                onClick={() => setSubFilter('yes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subFilter === 'yes' ? 'bg-yes/20 text-yes border border-yes/30' : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                YES Calls
              </button>
              <button
                onClick={() => setSubFilter('no')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subFilter === 'no' ? 'bg-no/20 text-no border border-no/30' : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                NO Calls
              </button>
              <button
                onClick={() => setSubFilter('high-confidence')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  subFilter === 'high-confidence' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                High Confidence (80%+)
              </button>
            </div>

            {/* Feed Items */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                ))}
              </div>
            ) : filteredCallouts.length > 0 ? (
              <div className="space-y-5">
                {filteredCallouts.map((callout) => (
                  <CalloutCard
                    key={callout.id}
                    callout={callout}
                    onCounterClick={() => setSelectedCalloutForCounter(callout)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/50">
                No callouts match the selected filters.
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 space-y-6 flex-shrink-0">
            <TopCallers />
            <TrendingCallouts />
          </div>
        </div>
      </main>

      {selectedCalloutForCounter && (
        <CounterCallModal
          originalCallout={selectedCalloutForCounter}
          isOpen={Boolean(selectedCalloutForCounter)}
          onClose={() => setSelectedCalloutForCounter(null)}
        />
      )}
    </div>
  );
}

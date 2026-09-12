"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { CalloutCard } from '@/components/organisms/social/CalloutCard';
import { Badge } from '@/components/atoms/Badge';
import { Callout, Profile } from '@/types/social';
import staticCallouts from '@/data/callouts.json';
import staticCreators from '@/data/creators.json';
import { Search, Users, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'callouts' | 'creators'>('all');

  const [matchedCallouts, setMatchedCallouts] = useState<Callout[]>([]);
  const [matchedCreators, setMatchedCreators] = useState<Profile[]>([]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setMatchedCallouts(staticCallouts as any);
      setMatchedCreators(staticCreators as any);
      return;
    }

    const filteredCalls = (staticCallouts as any).filter((c: Callout) =>
      c.headline.toLowerCase().includes(q) ||
      (c.thesis && c.thesis.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q) ||
      c.creator.handle.toLowerCase().includes(q)
    );

    const filteredCreators = (staticCreators as any).filter((cr: Profile) =>
      cr.handle.toLowerCase().includes(q) ||
      cr.displayName.toLowerCase().includes(q) ||
      (cr.bio && cr.bio.toLowerCase().includes(q))
    );

    setMatchedCallouts(filteredCalls);
    setMatchedCreators(filteredCreators);
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />

      <main className="flex-1 container max-w-screen-lg mx-auto px-4 py-8 space-y-6">
        {/* Search Header Bar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-yes/30 text-yes text-[10px]">
              UNIFIED SEARCH
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search callouts, creators, handles, topics..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-yes shadow-xl"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-yes text-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              All Results ({matchedCallouts.length + matchedCreators.length})
            </button>
            <button
              onClick={() => setActiveTab('callouts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'callouts'
                  ? 'bg-yes text-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Callouts ({matchedCallouts.length})
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'creators'
                  ? 'bg-yes text-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              Creators ({matchedCreators.length})
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-8">
          {/* Creators Match Section */}
          {(activeTab === 'all' || activeTab === 'creators') && matchedCreators.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-yes" />
                <span>Creators ({matchedCreators.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchedCreators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/profile/${creator.handle}`}
                    className="bg-[#070709] border border-white/10 hover:border-white/20 rounded-xl p-4 flex items-center gap-3 transition-all group"
                  >
                    <img src={creator.avatarUrl} alt={creator.handle} className="w-10 h-10 rounded-full border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-white truncate group-hover:text-yes transition-colors">
                          {creator.displayName}
                        </span>
                        {creator.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-yes fill-yes/20 flex-shrink-0" />}
                      </div>
                      <span className="text-[11px] text-white/40 font-mono block">@{creator.handle}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Callouts Match Section */}
          {(activeTab === 'all' || activeTab === 'callouts') && matchedCallouts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-yes" />
                <span>Callouts ({matchedCallouts.length})</span>
              </h3>

              <div className="space-y-4">
                {matchedCallouts.map((callout) => (
                  <CalloutCard key={callout.id} callout={callout} />
                ))}
              </div>
            </div>
          )}

          {matchedCallouts.length === 0 && matchedCreators.length === 0 && (
            <div className="text-center py-16 bg-[#070709] border border-white/10 rounded-2xl p-8 space-y-2">
              <Search className="w-8 h-8 text-white/20 mx-auto" />
              <h4 className="font-bold text-base text-white">No matching results</h4>
              <p className="text-xs text-white/40">Try searching for keywords like "Bitcoin", "Fed", "CryptoWhale", or "Macro".</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#070709] text-white">
        <Header />
        <main className="flex-1 container max-w-screen-lg mx-auto px-4 py-16 text-center text-white/40">
          Loading search...
        </main>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

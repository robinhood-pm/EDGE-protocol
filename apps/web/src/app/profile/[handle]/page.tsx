"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { ProfileHeader } from '@/components/organisms/social/ProfileHeader';
import { ProfileStats } from '@/components/organisms/social/ProfileStats';
import { ProfileTabs, ProfileTabType } from '@/components/organisms/social/ProfileTabs';
import { Profile, Callout } from '@/types/social';
import { Loader2, MessageSquareOff, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { formatCompactVolume } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams();
  const rawHandle = params?.handle as string;
  const handle = rawHandle ? rawHandle.toLowerCase() : '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTabType>('calls');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = rawApiUrl ? rawApiUrl : '';
    const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
    const network = rawNetwork ? rawNetwork : 'testnet';

    setIsLoading(true);

    // Fetch profile and user callouts concurrently
    Promise.all([
      fetch(`${backendUrl}/api/profiles/${handle}?network=${network}`).then((r) => r.ok ? r.json() : null),
      fetch(`${backendUrl}/api/callouts?creatorId=${handle}&network=${network}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([profData, calloutsData]) => {
        if (profData && profData.success && profData.profile) {
          setProfile(profData.profile);
        } else {
          setProfile(null);
        }

        if (calloutsData && calloutsData.success && Array.isArray(calloutsData.callouts)) {
          setCallouts(calloutsData.callouts);
        } else {
          setCallouts([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load profile data:', err);
        setProfile(null);
        setCallouts([]);
      })
      .finally(() => setIsLoading(false));
  }, [handle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070709] text-white">
        <Header />
        <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-yes" />
            <p className="text-sm font-medium">Loading creator profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070709] text-white">
        <Header />
        <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <MessageSquareOff className="w-12 h-12 text-white/30 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Creator Not Found</h2>
          <p className="text-white/60 text-sm max-w-md">
            No profile registered under @{handle}. Check the handle or verify testnet environment settings.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />

      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Prediction Reputation Stats */}
        {profile.stats && <ProfileStats stats={profile.stats} />}

        {/* Tab Navigation */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            calls: callouts.length,
            positions: 0,
            markets: 0,
            replies: 0,
          }}
        />

        {/* Tab Content */}
        {activeTab === 'calls' && (
          <div className="space-y-4">
            {callouts.length > 0 ? (
              callouts.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#070709] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all shadow-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={c.conviction === 'YES' ? 'secondary' : 'destructive'}
                        className={c.conviction === 'YES' ? 'bg-yes/20 text-yes border-yes/30 font-bold' : 'bg-no/20 text-no border-no/30 font-bold'}
                      >
                        {c.conviction} Call ({c.confidence}% Conf)
                      </Badge>
                      <span className="text-xs text-white/40 font-mono">Called at {c.callProbability}%</span>
                    </div>
                    <Badge variant="live">LIVE</Badge>
                  </div>

                  <h3 className="font-bold text-lg text-white mb-2 leading-snug">{c.headline}</h3>
                  {c.thesis && <p className="text-sm text-white/70 mb-4 line-clamp-2 leading-relaxed">{c.thesis}</p>}

                  {/* Market Bar */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={c.market.image} alt={c.market.title} className="w-8 h-8 object-contain rounded-md" />
                      <div>
                        <div className="font-semibold text-sm text-white">{c.market.title}</div>
                        <div className="text-xs text-white/50">Current Chance: {c.currentProbability}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-white/40">Market Vol</div>
                        <div className="text-xs font-bold text-white">{formatCompactVolume(c.market.totalVolume)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/50">
                No callouts published by this creator yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/50">
            Active positions will be synchronized from the exchange contract.
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/50">
            Markets proposed or created by this user will appear here.
          </div>
        )}

        {activeTab === 'replies' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/50">
            Comment history and counter-calls will appear here.
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React from 'react';
import { Profile } from '@/types/social';
import { Badge } from '@/components/atoms/Badge';
import { FollowButton } from '@/components/molecules/FollowButton';
import { CheckCircle2, Copy, ExternalLink, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const copyWalletAddress = () => {
    navigator.clipboard.writeText(profile.address);
    toast.success('Wallet address copied');
  };

  const truncatedAddress = `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;

  return (
    <div className="relative bg-[#070709] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl mb-6">
      {/* Cover Backdrop */}
      <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-emerald-900/40 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      </div>

      {/* Main Profile Info */}
      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
          {/* Avatar & Verification Badge */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-[#070709] bg-[#151924] overflow-hidden shadow-2xl flex items-center justify-center">
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            </div>
            {profile.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-yes text-white rounded-full p-1 shadow-lg ring-2 ring-[#070709]">
                <CheckCircle2 className="w-4 h-4 fill-yes text-[#070709]" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <FollowButton creatorId={profile.id} />
          </div>
        </div>

        {/* Name, Handle & Wallet */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{profile.displayName}</h1>
            {profile.isVerified && (
              <Badge variant="secondary" className="bg-yes/10 text-yes border-yes/20 text-xs">
                Verified Creator
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="font-mono text-white/80">@{profile.handle}</span>
            <span className="text-white/20">•</span>
            <button
              onClick={copyWalletAddress}
              className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md text-xs font-mono border border-white/10"
            >
              <span>{truncatedAddress}</span>
              <Copy className="w-3 h-3 opacity-60" />
            </button>
            {profile.xHandle && (
              <>
                <span className="text-white/20">•</span>
                <a
                  href={`https://x.com/${profile.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-xs"
                >
                  <span>@{profile.xHandle}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && <p className="text-sm text-white/80 max-w-2xl leading-relaxed mb-4">{profile.bio}</p>}

        {/* Social Counts */}
        {profile.stats && (
          <div className="flex items-center gap-6 pt-2 border-t border-white/5 text-sm">
            <div>
              <span className="font-bold text-white">{profile.stats.followersCount.toLocaleString()}</span>{' '}
              <span className="text-white/50">Followers</span>
            </div>
            <div>
              <span className="font-bold text-white">{profile.stats.followingCount.toLocaleString()}</span>{' '}
              <span className="text-white/50">Following</span>
            </div>
            <div className="flex items-center gap-1 text-white/50 text-xs ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined July 2026</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

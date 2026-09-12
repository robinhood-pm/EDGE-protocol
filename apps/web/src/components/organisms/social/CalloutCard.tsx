"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Callout } from '@/types/social';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { EmbeddedMarketCard } from '@/components/molecules/EmbeddedMarketCard';
import { SocialActionBar } from '@/components/molecules/SocialActionBar';
import { InlineTradeModal } from '@/components/organisms/social/InlineTradeModal';
import { CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

interface CalloutCardProps {
  callout: Callout;
  onTradeClick?: (side: 'YES' | 'NO') => void;
  onCounterClick?: () => void;
}

export function CalloutCard({ callout, onTradeClick, onCounterClick }: CalloutCardProps) {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedTradeSide, setSelectedTradeSide] = useState<'YES' | 'NO'>('YES');

  const isYesConviction = callout.conviction === 'YES';
  const formattedTime = new Date(callout.createdAt * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleOpenTrade = (side: 'YES' | 'NO') => {
    if (onTradeClick) {
      onTradeClick(side);
    } else {
      setSelectedTradeSide(side);
      setIsTradeModalOpen(true);
    }
  };

  return (
    <div className="bg-[#070709] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all shadow-xl backdrop-blur-xl relative group">
      {/* Header: Creator Info + Status Badge */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <Link href={`/profile/${callout.creator.handle}`} className="flex items-center gap-3 group/author">
          <div className="w-11 h-11 rounded-xl bg-[#151924] border border-white/10 overflow-hidden flex-shrink-0 shadow-md">
            <img src={callout.creator.avatarUrl} alt={callout.creator.displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white group-hover/author:text-yes transition-colors">
                {callout.creator.displayName}
              </span>
              {callout.creator.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-yes fill-yes/20" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="font-mono">@{callout.creator.handle}</span>
              <span>•</span>
              <span>{formattedTime}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {callout.status === 'LIVE' ? (
            <Badge variant="live">LIVE</Badge>
          ) : callout.status === 'WON' ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">WON (+{callout.snapshot.probabilityAtCall} pts)</Badge>
          ) : callout.status === 'LOST' ? (
            <Badge variant="destructive">LOST</Badge>
          ) : (
            <Badge variant="muted">{callout.status}</Badge>
          )}
        </div>
      </div>

      {/* Conviction Badge & Category */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-md border ${
            isYesConviction
              ? 'bg-yes/10 text-yes border-yes/30'
              : 'bg-no/10 text-no border-no/30'
          }`}
        >
          {callout.conviction === 'YES' ? 'YES CALL' : 'NO CALL'} • {callout.confidence}% CONFIDENCE
        </span>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wider text-white/50">
          {callout.category}
        </Badge>
      </div>

      {/* Headline & Thesis */}
      <Link href={`/callouts/${callout.id}`} className="block group/title">
        <h3 className="text-base sm:text-lg font-bold text-white group-hover/title:text-white/90 leading-snug mb-1.5">
          {callout.headline}
        </h3>
        {callout.thesis && (
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2 mb-3">
            {callout.thesis}
          </p>
        )}
      </Link>

      {/* Embedded Prediction Market Card */}
      <EmbeddedMarketCard
        market={callout.market}
        callProbability={callout.callProbability}
        currentProbability={callout.currentProbability}
      />

      {/* Inline Trade CTAs */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <Button
          variant="yes"
          size="sm"
          onClick={() => handleOpenTrade('YES')}
          className="w-full text-xs font-bold h-9"
        >
          Trade YES {callout.market.yesProbability}%
        </Button>
        <Button
          variant="no"
          size="sm"
          onClick={() => handleOpenTrade('NO')}
          className="w-full text-xs font-bold h-9"
        >
          Trade NO {callout.market.noProbability}%
        </Button>
      </div>

      {/* Social Action Footer */}
      <SocialActionBar
        metrics={callout.metrics}
        onCommentClick={() => (window.location.href = `/callouts/${callout.id}`)}
        onCounterClick={onCounterClick}
      />

      <InlineTradeModal
        callout={callout}
        initialSide={selectedTradeSide}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
      />
    </div>
  );
}


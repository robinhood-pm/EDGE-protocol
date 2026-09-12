"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Callout } from '@/types/social';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { EmbeddedMarketCard } from '@/components/molecules/EmbeddedMarketCard';
import { SocialActionBar } from '@/components/molecules/SocialActionBar';
import { InlineTradeModal } from '@/components/organisms/social/InlineTradeModal';
import { CheckCircle2, ShieldCheck, Flame, Eye } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';

interface CalloutCardProps {
  callout: Callout;
  onTradeClick?: (side: 'YES' | 'NO') => void;
  onCounterClick?: () => void;
  isCompact?: boolean;
}

export function CalloutCard({ callout, onTradeClick, onCounterClick, isCompact = false }: CalloutCardProps) {
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
    <div className={`bg-[#070709] border border-white/10 hover:border-white/20 rounded-2xl transition-all shadow-xl backdrop-blur-xl relative group ${isCompact ? 'p-4 space-y-2' : 'p-5'}`}>
      {/* Header: Creator Info + View Count (Top Right when Compact) / Status Badge */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link href={`/profile/${callout.creator.handle}`} className="flex items-center gap-2.5 group/author">
          <div className="w-9 h-9 rounded-xl bg-[#151924] border border-white/10 overflow-hidden flex-shrink-0 shadow-md">
            <img src={callout.creator.avatarUrl} alt={callout.creator.displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white group-hover/author:text-yes transition-colors">
                {callout.creator.displayName}
              </span>
              {callout.creator.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-yes fill-yes/20" />}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span className="font-mono">@{callout.creator.handle}</span>
              <span>•</span>
              <span>{formattedTime}</span>
            </div>
          </div>
        </Link>

        {isCompact ? (
          <div className="flex items-center gap-1.5 text-white/50 text-xs font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatCompactNumber(callout.metrics.views)}</span>
          </div>
        ) : (
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
        )}
      </div>

      {/* Conviction Badge & Category (Hidden when compact) */}
      {!isCompact && (
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
      )}

      {/* Headline & Thesis */}
      <Link href={`/callouts/${callout.id}`} className="block group/title">
        <h3 className={`font-bold text-white group-hover/title:text-white/90 leading-snug ${isCompact ? 'text-xs mb-1' : 'text-base sm:text-lg mb-1.5'}`}>
          {callout.headline}
        </h3>
        {callout.thesis && !isCompact && (
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2 mb-3">
            {callout.thesis}
          </p>
        )}
      </Link>

      {/* Embedded Prediction Market Card (Position & Profit) */}
      <EmbeddedMarketCard
        market={callout.market}
        callProbability={callout.callProbability}
        currentProbability={callout.currentProbability}
        hideProbabilityBar={isCompact}
      />

      {/* Inline Trade CTAs (Hidden when compact) */}
      {!isCompact && (
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
      )}

      {/* Social Action Footer */}
      <SocialActionBar
        metrics={callout.metrics}
        onCommentClick={() => (window.location.href = `/callouts/${callout.id}`)}
        onCounterClick={onCounterClick}
        isCompact={isCompact}
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


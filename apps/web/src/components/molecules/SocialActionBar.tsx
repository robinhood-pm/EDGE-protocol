"use client";

import React, { useState } from 'react';
import { CalloutMetrics } from '@/types/social';
import { Heart, MessageSquare, Repeat, Eye, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCompactNumber } from '@/lib/utils';

interface SocialActionBarProps {
  metrics: CalloutMetrics;
  onCommentClick?: () => void;
  onCounterClick?: () => void;
  isCompact?: boolean;
}

export function SocialActionBar({ metrics, onCommentClick, onCounterClick, isCompact = false }: SocialActionBarProps) {
  const [likes, setLikes] = useState(metrics.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      setLikes((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
      toast.success('Callout liked');
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removed from saved' : 'Saved to bookmarks');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="flex items-center justify-between text-xs text-white/50 pt-3 border-t border-white/5">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${
            isLiked ? 'text-rose-500' : 'hover:text-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="font-mono">{formatCompactNumber(likes)}</span>
        </button>

        {/* Comments */}
        <button
          onClick={onCommentClick}
          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="font-mono">{formatCompactNumber(metrics.comments)}</span>
        </button>

        {/* Repost */}
        <button
          onClick={onCounterClick}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
        >
          <Repeat className="w-4 h-4" />
          <span className="font-mono">{formatCompactNumber(metrics.reposts)}</span>
        </button>

        {/* Views (Hidden when compact, since views is displayed at top right of compact card) */}
        {!isCompact && (
          <div className="flex items-center gap-1.5 text-white/40">
            <Eye className="w-4 h-4" />
            <span className="font-mono">{formatCompactNumber(metrics.views)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Market Cap (Hidden when compact) */}
        {!isCompact && metrics.marketCap && (
          <span className="text-[11px] font-mono font-bold text-white/40">
            MC {metrics.marketCap}
          </span>
        )}

        {/* Bookmark */}
        <button
          onClick={handleSave}
          className={`p-1.5 rounded-lg transition-colors ${
            isSaved ? 'text-amber-400 bg-amber-400/10' : 'hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

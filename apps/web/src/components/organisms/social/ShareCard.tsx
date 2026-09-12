"use client";

import React, { useState } from 'react';
import { Callout } from '@/types/social';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Share2, Copy, Check, ExternalLink, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareCardProps {
  callout: Callout;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareCard({ callout, isOpen, onClose }: ShareCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/callouts/${callout.id}` : '';
  const shareText = `"${callout.headline}" — @${callout.creator.handle} called ${callout.conviction} at ${callout.callProbability}% on Edge Protocol.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Callout link copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0c0d12] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <Badge variant="outline" className="border-yes/30 text-yes text-[10px]">
            SHARE PREDICTION CALLOUT
          </Badge>
          <h3 className="font-bold text-base text-white">Spread the Prediction</h3>
        </div>

        {/* Card OG Preview Frame */}
        <div className="bg-gradient-to-br from-[#12131c] to-[#070709] border border-white/15 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={callout.creator.avatarUrl} alt={callout.creator.handle} className="w-8 h-8 rounded-full border border-white/10" />
              <div>
                <span className="font-bold text-xs text-white block">@{callout.creator.handle}</span>
                <span className="text-[10px] text-white/40 font-mono">EDGE PROTOCOL</span>
              </div>
            </div>
            <Badge variant={callout.conviction === 'YES' ? 'secondary' : 'destructive'} className="text-[10px]">
              {callout.conviction} ({callout.confidence}%)
            </Badge>
          </div>

          <h4 className="font-bold text-sm text-white leading-snug">{callout.headline}</h4>

          <div className="flex items-center justify-between text-xs bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-white/60">Call Probability</span>
            <span className="font-mono font-bold text-yes">{callout.callProbability}%</span>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <Button onClick={handleShareTwitter} className="w-full font-bold gap-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white">
            <Share2 className="w-4 h-4" />
            Share to X / Twitter
          </Button>

          <Button onClick={handleCopyLink} variant="outline" className="w-full font-bold gap-2">
            {isCopied ? <Check className="w-4 h-4 text-yes" /> : <Copy className="w-4 h-4" />}
            {isCopied ? 'Copied Link' : 'Copy Direct Link'}
          </Button>
        </div>
      </div>
    </div>
  );
}

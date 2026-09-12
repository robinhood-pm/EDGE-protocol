"use client";

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Callout } from '@/types/social';
import { X, Repeat, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CounterCallModalProps {
  originalCallout: Callout;
  isOpen: boolean;
  onClose: () => void;
}

export function CounterCallModal({ originalCallout, isOpen, onClose }: CounterCallModalProps) {
  const counterConviction = originalCallout.conviction === 'YES' ? 'NO' : 'YES';
  const [thesis, setThesis] = useState('');
  const [confidence, setConfidence] = useState(70);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      toast.success(`Counter Call published against @${originalCallout.creator.handle}`);
      setThesis('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#070709] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-no" />
          <h2 className="text-lg font-bold text-white">Post Counter Call</h2>
        </div>

        {/* Original Callout Summary */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Original Call by @{originalCallout.creator.handle}</span>
            <Badge variant="outline" className="text-[10px]">{originalCallout.conviction} CALL</Badge>
          </div>
          <p className="text-sm font-semibold text-white/90 line-clamp-2">{originalCallout.headline}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-no/10 border border-no/30 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-no">
            <span>YOUR COUNTER SIDE: {counterConviction}</span>
            <span>OPPOSING CALL</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
              <span>Confidence</span>
              <span className="text-white font-mono">{confidence}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={99}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-no cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
              Counter Thesis / Reasoning
            </label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={3}
              placeholder="Why is this callout wrong? Present your counter argument..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-no text-sm leading-relaxed"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="no"
            className="w-full font-bold h-11 rounded-xl text-sm"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Counter Call'}
          </Button>
        </form>
      </div>
    </div>
  );
}

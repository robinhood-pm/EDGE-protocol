"use client";

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { X, Send, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

interface MarketProposalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MarketProposalForm({ isOpen, onClose }: MarketProposalFormProps) {
  const { address } = useAccount();
  const [question, setQuestion] = useState('');
  const [yesCondition, setYesCondition] = useState('');
  const [noCondition, setNoCondition] = useState('');
  const [deadline, setDeadline] = useState('');
  const [resolutionSource, setResolutionSource] = useState('');
  const [category, setCategory] = useState('Crypto');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !yesCondition.trim() || !noCondition.trim() || !deadline || !resolutionSource.trim()) {
      toast.error('Please fill in all proposal fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${backendUrl}/api/social/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposerId: address || '0x4AedeF2aa208737A2c672EC65402419c284e00fF',
          question,
          yesCondition,
          noCondition,
          deadline,
          resolutionSource,
          category,
          network: 'testnet',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit market proposal');
      }

      toast.success('Market proposal submitted for community approval!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Proposal submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0c0d12] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-yes/30 text-yes text-[10px]">
              COMMUNITY MARKET PROPOSAL
            </Badge>
          </div>
          <h3 className="font-bold text-lg text-white">Propose a New Prediction Market</h3>
          <p className="text-xs text-white/50">
            Cannot find a market covering your callout topic? Propose a new market for Edge Protocol listing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Question */}
          <div className="space-y-1.5">
            <label className="font-bold text-white">Market Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Will Federal Reserve cut rates in September 2026?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yes"
            />
          </div>

          {/* Resolution Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-yes">YES Outcome Rule</label>
              <textarea
                value={yesCondition}
                onChange={(e) => setYesCondition(e.target.value)}
                placeholder="Resolves YES if target rate is lowered by >= 25 bps..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yes"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-no">NO Outcome Rule</label>
              <textarea
                value={noCondition}
                onChange={(e) => setNoCondition(e.target.value)}
                placeholder="Resolves NO if rates remain unchanged or increased..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-no"
              />
            </div>
          </div>

          {/* Category & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-white">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#14151f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yes"
              >
                <option value="Crypto">Crypto</option>
                <option value="Macro">Macro</option>
                <option value="Rates">Rates</option>
                <option value="Stocks">Stocks</option>
                <option value="Technology">Technology</option>
                <option value="World">World</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white">Resolution Date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#14151f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yes"
              />
            </div>
          </div>

          {/* Resolution Source */}
          <div className="space-y-1.5">
            <label className="font-bold text-white">Official Resolution Oracle Source</label>
            <input
              type="text"
              value={resolutionSource}
              onChange={(e) => setResolutionSource(e.target.value)}
              placeholder="e.g. Federal Reserve Press Release / official website"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yes"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full font-bold py-3 text-sm gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Proposal
          </Button>
        </form>
      </div>
    </div>
  );
}

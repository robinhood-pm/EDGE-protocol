"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { CalloutCard } from '@/components/organisms/social/CalloutCard';
import { CounterCallModal } from '@/components/organisms/social/CounterCallModal';
import { Callout } from '@/types/social';
import { ArrowLeft, MessageSquare, Repeat, Users, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { toast } from 'react-hot-toast';

import { useAccount } from 'wagmi';
import { CommentItem } from '@/components/molecules/CommentItem';

export default function CalloutDetailPage() {
  const params = useParams();
  const calloutId = params?.id as string;
  const { address } = useAccount();

  const [calloutData, setCalloutData] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Derive current creator profile dynamically from connected wallet or address fallback
  const currentUserHandle = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : 'anonymous';
  const currentUserAvatar = address
    ? `https://api.dicebear.com/9.x/thumbs/svg?seed=${address}`
    : 'https://api.dicebear.com/9.x/thumbs/svg?seed=anonymous';

  useEffect(() => {
    if (!calloutId) return;
    setIsLoading(true);

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = rawApiUrl ? rawApiUrl : '';
    const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
    const network = rawNetwork ? rawNetwork : 'testnet';

    fetch(`${backendUrl}/api/callouts/${calloutId}?network=${network}`)
      .then((res) => {
        if (!res.ok) throw new Error('Callout not found');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.callout) {
          setCalloutData({
            callout: data.callout,
            counterCalls: data.counterCalls || [],
            comments: data.comments || [],
            topCallers: data.topCallers || { yes: [], no: [] },
            creatorConsensus: data.creatorConsensus || { allCreators: { yesPct: 50, totalCallers: 1 } },
          });
        }
      })
      .catch((err) => {
        console.error('Error loading callout detail:', err);
        setCalloutData(null);
      })
      .finally(() => setIsLoading(false));
  }, [calloutId]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const targetCalloutId = calloutId;
    const newComment = {
      id: `comment-${Date.now()}`,
      calloutId: targetCalloutId,
      creator: {
        handle: currentUserHandle,
        displayName: currentUserHandle,
        avatarUrl: currentUserAvatar,
        isVerified: !!address
      },
      content: commentText,
      likes: 0,
      createdAt: Math.floor(Date.now() / 1000),
      network: 'testnet' as const
    };

    setCalloutData((prev: any) => ({
      ...prev,
      comments: [newComment, ...(prev?.comments || [])]
    }));

    toast.success('Comment posted');
    setCommentText('');
  };

  const handleReplyComment = (parentId: string, replyContent: string) => {
    const targetCalloutId = calloutId;
    const newReply = {
      id: `reply-${Date.now()}`,
      calloutId: targetCalloutId,
      parentId,
      creator: {
        handle: currentUserHandle,
        displayName: currentUserHandle,
        avatarUrl: currentUserAvatar,
        isVerified: !!address
      },
      content: replyContent,
      likes: 0,
      createdAt: Math.floor(Date.now() / 1000),
      network: 'testnet' as const
    };

    setCalloutData((prev: any) => ({
      ...prev,
      comments: [...(prev?.comments || []), newReply]
    }));
  };

  if (isLoading || !calloutData) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070709] text-white">
        <Header />
        <main className="flex-1 container max-w-screen-lg mx-auto px-4 py-12 flex items-center justify-center">
          <p className="text-white/50">Loading callout detail...</p>
        </main>
      </div>
    );
  }

  const callout = calloutData.callout as Callout;

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <Header />

      <main className="flex-1 container max-w-screen-lg mx-auto px-4 py-8">
        <Link
          href="/callouts"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Callouts Feed</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Callout Feed Card */}
            <CalloutCard
              callout={callout}
              onCounterClick={() => setIsCounterModalOpen(true)}
            />

            {/* Counter Calls Section */}
            {calloutData.counterCalls && calloutData.counterCalls.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white/70 uppercase tracking-wider flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-no" />
                  <span>Counter Calls ({calloutData.counterCalls.length})</span>
                </h3>

                {calloutData.counterCalls.map((cc: any) => (
                  <div key={cc.id} className="bg-[#070709] border border-no/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img src={cc.creator.avatarUrl} alt={cc.creator.displayName} className="w-6 h-6 rounded-full" />
                        <span className="font-bold text-white">@{cc.creator.handle}</span>
                      </div>
                      <Badge variant="destructive">{cc.conviction} COUNTER ({cc.confidence}%)</Badge>
                    </div>
                    {cc.thesis && <p className="text-xs text-white/80 leading-relaxed">{cc.thesis}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Comments Thread Section */}
            <div className="bg-[#070709] border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-yes" />
                <span>Discussion ({calloutData.comments?.length || 0})</span>
              </h3>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Join the discussion or add your thesis..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yes"
                />
                <Button type="submit" size="sm" className="font-bold gap-1 px-4">
                  <Send className="w-4 h-4" />
                  <span>Reply</span>
                </Button>
              </form>

              {/* Comment List */}
              <div className="space-y-4 pt-2">
                {calloutData.comments.map((cm: any) => (
                  <CommentItem
                    key={cm.id}
                    comment={cm}
                    onReply={handleReplyComment}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Callers Breakdown */}
            <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-yes" />
                <span>Top Callers Breakdown</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-yes mb-1">YES Callers ({calloutData.topCallers.yes.length})</div>
                  {calloutData.topCallers.yes.map((tc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1 text-white/70">
                      <span>@{tc.handle}</span>
                      <span className="font-mono text-white/40">Called at {tc.calledAt}%</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="font-semibold text-no mb-1">NO Callers ({calloutData.topCallers.no.length})</div>
                  {calloutData.topCallers.no.map((tc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1 text-white/70">
                      <span>@{tc.handle}</span>
                      <span className="font-mono text-white/40">Called at {tc.calledAt}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Creator Consensus */}
            <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-sm text-white">Creator Consensus</h4>
              <div className="text-2xl font-black text-yes">
                {calloutData.creatorConsensus.allCreators.yesPct}% YES
              </div>
              <p className="text-xs text-white/50">
                Based on {calloutData.creatorConsensus.allCreators.totalCallers} top predictions recorded on Edge.
              </p>
            </div>
          </div>
        </div>
      </main>

      <CounterCallModal
        originalCallout={callout}
        isOpen={isCounterModalOpen}
        onClose={() => setIsCounterModalOpen(false)}
      />
    </div>
  );
}

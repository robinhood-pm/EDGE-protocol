"use client";

import React, { useState } from 'react';
import { Comment } from '@/types/social';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Heart, Reply, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CommentItemProps {
  comment: Comment;
  onReply?: (parentId: string, content: string) => void;
}

export function CommentItem({ comment, onReply }: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = () => {
    if (isLiked) {
      setLikes((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
      toast.success('Comment liked');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    if (onReply) {
      onReply(comment.id, replyContent);
    }
    toast.success('Reply posted');
    setReplyContent('');
    setIsReplying(false);
  };

  const timeFormatted = new Date(comment.createdAt * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="border-b border-white/5 pb-4 last:border-0 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={comment.creator.avatarUrl} alt={comment.creator.handle} className="w-7 h-7 rounded-full border border-white/10" />
          <span className="font-bold text-xs text-white">{comment.creator.displayName || comment.creator.handle}</span>
          {comment.creator.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-yes fill-yes/20" />}
          <span className="text-[11px] text-white/40 font-mono">@{comment.creator.handle}</span>

          {/* Position Badge Disclosure */}
          {comment.positionBadge && (
            <Badge
              variant={comment.positionBadge.side === 'YES' ? 'secondary' : 'destructive'}
              className={
                comment.positionBadge.side === 'YES'
                  ? 'bg-yes/20 text-yes border-yes/30 text-[10px] py-0 px-2'
                  : 'bg-no/20 text-no border-no/30 text-[10px] py-0 px-2'
              }
            >
              Holder: {comment.positionBadge.side} ({comment.positionBadge.shares.toLocaleString()} shares)
            </Badge>
          )}
        </div>

        <span className="text-[11px] text-white/40 font-mono">{timeFormatted}</span>
      </div>

      <p className="text-xs text-white/80 leading-relaxed pl-9">{comment.content}</p>

      {/* Comment Action Footer */}
      <div className="flex items-center gap-4 pl-9 text-[11px] text-white/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${
            isLiked ? 'text-rose-500 font-bold' : 'hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
          <span>{likes}</span>
        </button>

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <Reply className="w-3.5 h-3.5" />
          <span>Reply</span>
        </button>
      </div>

      {/* Reply Input Form */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="pl-9 pt-2 flex gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Replying to @${comment.creator.handle}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yes"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8 text-xs px-3 font-bold">
            <Send className="w-3 h-3" />
          </Button>
        </form>
      )}
    </div>
  );
}

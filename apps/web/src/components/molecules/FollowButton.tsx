"use client";

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FollowButtonProps {
  creatorId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function FollowButton({
  creatorId,
  initialIsFollowing = false,
  onFollowChange,
  size = 'default',
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    const nextState = !isFollowing;

    // Optimistic UI update
    setIsFollowing(nextState);
    if (onFollowChange) onFollowChange(nextState);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const endpoint = `${backendUrl}/api/profiles/follow`;
      const method = nextState ? 'POST' : 'DELETE';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: 'current-user', followingId: creatorId }),
      });

      if (!res.ok) {
        // Revert on failure
        setIsFollowing(!nextState);
        if (onFollowChange) onFollowChange(!nextState);
        toast.error('Failed to update follow status');
      } else {
        toast.success(nextState ? 'Following creator' : 'Unfollowed creator');
      }
    } catch {
      // Revert on exception
      setIsFollowing(!nextState);
      if (onFollowChange) onFollowChange(!nextState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`gap-2 rounded-full font-semibold transition-all shadow-md ${
        isFollowing
          ? 'border-white/20 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
          : 'bg-white text-black hover:bg-white/90'
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}

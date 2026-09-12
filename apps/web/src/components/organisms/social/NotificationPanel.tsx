"use client";

import React, { useState } from 'react';
import { NotificationItem } from '@/types/social';
import staticNotifications from '@/data/notifications.json';
import { Bell, Check, Zap, Flame, Trophy, MessageSquare, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(staticNotifications as any);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'new_callout':
        return <Zap className="w-4 h-4 text-yes" />;
      case 'counter_call':
        return <Flame className="w-4 h-4 text-no" />;
      case 'callout_won':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'new_follower':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-white/70" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yes text-black font-extrabold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0c0d12] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yes/20 text-yes font-mono text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkSingleRead(n.id)}
                  className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex gap-3 items-start ${
                    !n.isRead
                      ? 'bg-yes/5 border-yes/20 text-white'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/10'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="leading-relaxed">{n.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                      <span>{new Date(n.createdAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-yes" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

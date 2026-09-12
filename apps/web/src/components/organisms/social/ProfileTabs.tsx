"use client";

import React from 'react';
import { MessageSquare, PieChart, Layers, Reply } from 'lucide-react';

export type ProfileTabType = 'calls' | 'positions' | 'markets' | 'replies';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  counts?: {
    calls?: number;
    positions?: number;
    markets?: number;
    replies?: number;
  };
}

export function ProfileTabs({ activeTab, onTabChange, counts }: ProfileTabsProps) {
  const tabs: { id: ProfileTabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'calls', label: 'Callouts', icon: MessageSquare, count: counts?.calls },
    { id: 'positions', label: 'Positions', icon: PieChart, count: counts?.positions },
    { id: 'markets', label: 'Created Markets', icon: Layers, count: counts?.markets },
    { id: 'replies', label: 'Replies', icon: Reply, count: counts?.replies },
  ];

  return (
    <div className="w-full border-b border-white/10 mb-6 bg-[#070709]/60 backdrop-blur-xl sticky top-16 z-30">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'text-white border-white bg-white/5 font-semibold'
                  : 'text-white/50 border-transparent hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/40'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

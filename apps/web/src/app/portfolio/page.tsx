"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/portfolio/${address}`);
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
    enabled: !!address,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Briefcase className="w-16 h-16 text-muted mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
        <p className="text-muted">Please connect your wallet to view your portfolio.</p>
      </div>
    );
  }

  const positions = data?.positions || [];
  const totalInvested = positions.reduce((acc: number, pos: any) => acc + pos.totalInvested, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Markets
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Your Portfolio</h1>
          <p className="text-muted">Manage your active positions and history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm font-medium text-muted mb-1 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Total Value
          </div>
          <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Active Positions</h2>
      
      {isLoading ? (
        <div className="text-center py-12 text-muted animate-pulse">Loading positions...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-red-500/10 rounded-xl">Error loading portfolio</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted mb-4">You don't have any active positions yet.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-foreground text-background font-medium rounded hover:bg-neutral-300 transition-colors">
            Explore Markets
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((pos: any) => (
            <div key={pos.marketId} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center gap-4">
                <img src={pos.marketImage} alt={pos.marketTitle} className="w-12 h-12 rounded object-cover" />
                <div>
                  <h3 className="font-bold">{pos.marketTitle}</h3>
                  <div className="text-sm text-muted mt-1">Invested: ${pos.totalInvested.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">YES Shares</div>
                  <div className="font-bold text-yes">{pos.yesShares}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">NO Shares</div>
                  <div className="font-bold text-no">{pos.noShares}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

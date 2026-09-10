"use client";

import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, TrendingUp, History, Activity, PieChart, ExternalLink, Filter, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingId(orderId);
      const signature = await signMessageAsync({ message: `Cancel Order: ${orderId}` });
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel order');
      }

      // Refresh portfolio
      queryClient.invalidateQueries({ queryKey: ['portfolio', address] });
    } catch (err: any) {
      console.error("Cancel failed:", err);
      alert(err.message || "Failed to cancel order");
    } finally {
      setCancelingId(null);
    }
  };

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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <Briefcase className="w-10 h-10 text-muted" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight">Connect Wallet</h1>
          <p className="text-muted max-w-md mb-8">Please connect your wallet to view your active positions, trading history, and portfolio analytics.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const positions = data?.positions || [];
  const history = data?.history || [];
  const totalInvested = positions.reduce((acc: number, pos: any) => acc + pos.totalInvested, 0);
  const totalPositions = positions.length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Portfolio</h1>
            <p className="text-muted text-lg">Manage your active positions and track your trading performance.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="text-sm font-medium text-muted mb-2 flex items-center">
              Total Value
            </div>
            <div className="text-3xl font-bold tracking-tight">${totalInvested.toFixed(2)}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <PieChart className="w-16 h-16" />
            </div>
            <div className="text-sm font-medium text-muted mb-2 flex items-center">
              Active Positions
            </div>
            <div className="text-3xl font-bold tracking-tight">{totalPositions}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16" />
            </div>
            <div className="text-sm font-medium text-muted mb-2 flex items-center">
              Total Trades
            </div>
            <div className="text-3xl font-bold tracking-tight">{history.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab('positions')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'positions' ? 'text-white' : 'text-muted hover:text-white/80'}`}
          >
            <span className="flex items-center">Active Positions</span>
            {activeTab === 'positions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-white' : 'text-muted hover:text-white/80'}`}
          >
            <span className="flex items-center">Transaction History</span>
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
            Loading portfolio data...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl">
            Failed to load portfolio. Please try again.
          </div>
        ) : activeTab === 'positions' ? (
          /* Positions View */
          positions.length === 0 ? (
            <div className="text-center py-24 bg-white/5 border border-white/10 rounded-2xl border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Active Positions</h3>
              <p className="text-muted mb-6 max-w-sm mx-auto">You don't have any active positions yet. Start predicting to see your portfolio grow.</p>
              <Link href="/" className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors">
                Explore Markets
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {positions.map((pos: any) => (
                <div key={pos.marketId} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/30 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        {pos.marketImage ? (
                          <img src={pos.marketImage} alt={pos.marketTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs text-muted">No Image</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg truncate pr-4">{pos.marketTitle}</h3>
                        <div className="text-sm text-muted mt-1 flex items-center">
                          <span className="text-white/80 font-medium">${pos.totalInvested.toFixed(2)}</span>
                          <span className="mx-2 text-white/20">•</span>
                          <Link href={`/market/${pos.marketSlug || pos.marketId}`} className="hover:text-white flex items-center">
                            View Market <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 sm:gap-6 shrink-0 bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="text-center px-2">
                        <div className="text-[10px] text-muted font-bold mb-1 uppercase tracking-wider">YES Shares</div>
                        <div className="font-bold text-yes text-lg">{Number(pos.yesShares).toFixed(1)}</div>
                      </div>
                      <div className="w-px bg-white/10"></div>
                      <div className="text-center px-2">
                        <div className="text-[10px] text-muted font-bold mb-1 uppercase tracking-wider">NO Shares</div>
                        <div className="font-bold text-no text-lg">{Number(pos.noShares).toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* History View */
          history.length === 0 ? (
            <div className="text-center py-24 bg-white/5 border border-white/10 rounded-2xl border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Transaction History</h3>
              <p className="text-muted mb-6">Your trading history will appear here once you start participating in markets.</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/10 text-muted text-xs uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-6 font-semibold">Market</th>
                      <th className="py-4 px-6 font-semibold">Side</th>
                      <th className="py-4 px-6 font-semibold">Type</th>
                      <th className="py-4 px-6 font-semibold">Price</th>
                      <th className="py-4 px-6 font-semibold">Shares</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                      <th className="py-4 px-6 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {history.map((order: any) => (
                      <tr 
                        key={order.id} 
                        onClick={() => window.location.href = `/market/${order.markets?.slug || order.market_id}`}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 text-white/70 whitespace-nowrap">
                          <div className="font-medium text-white/90">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                          <div className="text-xs">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td className="py-4 px-6 font-medium text-white max-w-[250px] truncate" title={order.markets?.title}>
                          {order.markets?.title || 'Unknown Market'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${order.side === 'YES' ? 'bg-yes/10 text-yes border-yes/20' : 'bg-no/10 text-no border-no/20'}`}>
                            {order.side}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-white/80">{order.order_type}</td>
                        <td className="py-4 px-6 font-medium">{Number(order.price).toFixed(1)}¢</td>
                        <td className="py-4 px-6 font-medium">{Number(order.amount).toFixed(1)}</td>
                        <td className="py-4 px-6">
                          <span className={`flex items-center w-fit px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            order.status === 'FILLED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {order.status === 'PENDING' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5 animate-pulse" />}
                            {order.status === 'FILLED' && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />}
                            {order.status === 'CANCELLED' && <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order.id);
                              }}
                              disabled={cancelingId === order.id}
                              className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-bold disabled:opacity-50 flex items-center gap-1 ml-auto"
                            >
                              {cancelingId === order.id ? (
                                <div className="w-3 h-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

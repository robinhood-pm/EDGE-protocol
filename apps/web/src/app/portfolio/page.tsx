"use client";

import React, { useState } from 'react';
import { TrendingUp, ArrowDownRight, Wallet, History, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Header } from '@/components/organisms/Header';

import portfolioData from '@/data/portfolio.json';

const { openPositions, resolvedPositions } = portfolioData;

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  
  // Calculate Summary
  const totalPositionValue = openPositions.reduce((acc, pos) => acc + pos.totalValue, 0);
  const totalPnL = openPositions.reduce((acc, pos) => acc + pos.pnlValue, 0);
  const claimableWinnings = resolvedPositions.filter(p => p.status === 'WON' && !p.claimed).reduce((acc, pos) => acc + pos.claimableAmount, 0);
  
  const cashBalance = 12450.00;
  const totalAccountValue = cashBalance + totalPositionValue;

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-screen-xl mx-auto px-4 py-8 mt-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LEFT COLUMN: Summary & Navigation */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          
          {/* Account Value Card */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
            <h2 className="text-muted text-sm font-medium mb-2">Total Account Value</h2>
            <div className="text-4xl font-semibold mb-4 tracking-tight">
              ${totalAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Open Positions
                </span>
                <span className="font-medium">${totalPositionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Cash Balance
                </span>
                <span className="font-medium">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <Button className="w-full bg-[#594EE6] text-white hover:bg-[#483ecd]">Deposit</Button>
              <Button variant="outline" className="w-full">Withdraw</Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('open')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === 'open' ? 'bg-white/5 text-foreground font-medium' : 'text-muted hover:bg-white/5 hover:text-foreground'}`}
            >
              <span className="flex items-center gap-3"><BarChart3 className="w-5 h-5" /> Open Positions</span>
              <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{openPositions.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === 'history' ? 'bg-white/5 text-foreground font-medium' : 'text-muted hover:bg-white/5 hover:text-foreground'}`}
            >
              <span className="flex items-center gap-3"><History className="w-5 h-5" /> History</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* OPEN POSITIONS TAB */}
          {activeTab === 'open' && (
            <>
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl font-semibold">Active Predictions</h2>
                <div className="text-sm text-muted">
                  Unrealized PnL: 
                  <span className={`ml-2 font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
                  </span>
                </div>
              </div>

              {openPositions.map((pos) => (
                <div key={pos.id} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5 transition-all hover:bg-white/10 hover:border-white/20">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${pos.outcome === 'YES' ? 'bg-yes/10 text-yes' : 'bg-no/10 text-no'}`}>
                          {pos.outcome}
                        </span>
                        <span className="text-xs text-muted">Shares: {pos.shares.toLocaleString()}</span>
                      </div>
                      <h3 className="text-lg font-semibold">{pos.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold">${pos.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className={`text-sm flex items-center justify-end gap-1 mt-1 ${pos.pnlValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pos.pnlValue >= 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {pos.pnlValue >= 0 ? '+' : ''}{pos.pnlPercent}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                    <div>
                      <div className="text-xs text-muted mb-1">Avg Buy Price</div>
                      <div className="text-sm font-medium">{pos.avgBuyPrice * 100}¢</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-1">Current Price</div>
                      <div className="text-sm font-medium">{Math.round(pos.currentPrice * 100)}¢</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-1">Est. Payout if Won</div>
                      <div className="text-sm font-medium">${pos.shares.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8">Trade</Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* HISTORY / RESOLVED TAB */}
          {activeTab === 'history' && (
            <>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Past Predictions</h2>
                {claimableWinnings > 0 && (
                  <Button className="bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    Claim ${claimableWinnings.toLocaleString()} Winnings
                  </Button>
                )}
              </div>

              {resolvedPositions.map((pos) => (
                <div key={pos.id} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5 opacity-80 hover:opacity-100 transition-all hover:bg-white/10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${pos.status === 'WON' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {pos.status}
                        </span>
                        <span className="text-xs text-muted">Bet {pos.outcome} • {pos.shares.toLocaleString()} Shares</span>
                      </div>
                      <h3 className="text-lg font-semibold">{pos.title}</h3>
                    </div>
                    <div className="text-right">
                      {pos.status === 'WON' ? (
                        <>
                          <div className="text-xl font-semibold text-green-500">+${pos.claimableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          {!pos.claimed && <div className="text-xs text-green-400 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> Ready to Claim</div>}
                          {pos.claimed && <div className="text-xs text-muted mt-1">Claimed</div>}
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-semibold text-red-500">-$0.00</div>
                          <div className="text-xs text-muted mt-1">Expired Worthless</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </div>
    </main>
  );
}

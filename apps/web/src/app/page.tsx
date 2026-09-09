import React from 'react';
import { Header } from '@/components/organisms/Header';
import { CategoryTabs } from '@/components/organisms/CategoryTabs';
import { MarketCard } from '@/components/molecules/MarketCard';
import marketsData from '@/data/markets.json';
import { Market } from '@/types';

export default function Home() {
  const markets = marketsData as Market[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CategoryTabs />
      
      <main className="flex-1 container max-w-screen-2xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
            {/* Promo Banner */}
            <div className="bg-card rounded-xl overflow-hidden border border-border relative aspect-[2/1] flex items-center justify-center p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
              <div className="relative z-10">
                <h3 className="font-bold text-xl mb-2">Stay in the Loop</h3>
                <p className="text-sm text-muted">Join the Predict mailing list</p>
              </div>
            </div>

            {/* Games Section */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <span className="text-red-500">((•))</span> Games
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800" />
                    <span>MGC</span>
                  </div>
                  <span className="font-medium">43%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800" />
                    <span>FAZE</span>
                  </div>
                  <span className="font-medium">61%</span>
                </div>
              </div>
            </div>

            {/* Crypto Up/Down Section */}
            <div>
              <h2 className="text-lg font-bold mb-4">Crypto Up/Down</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold">₿</div>
                    <span className="font-medium">BTC</span>
                  </div>
                  <span className="text-muted font-mono">$78,582.01</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">Ξ</div>
                    <span className="font-medium">ETH</span>
                  </div>
                  <span className="text-muted font-mono">$2,488.27</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

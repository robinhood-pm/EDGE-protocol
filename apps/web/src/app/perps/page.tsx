"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';

export default function PerpsDashboard() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const network = process.env.NEXT_PUBLIC_NETWORK;
    fetch(`${apiUrl}/api/perps?network=${network}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMarkets(data.markets);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#00C805]/30">
      <Header />
      
      <main className="container max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Perpetual Markets</h1>
            <p className="text-white/60 mt-1">Trade prediction markets with up to 10x leverage.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-white/5 rounded-xl w-full"></div>
            <div className="h-16 bg-white/5 rounded-xl w-full"></div>
            <div className="h-16 bg-white/5 rounded-xl w-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <Link key={market.id} href={`/perps/${market.id}`}>
                <div className="bg-[#070709] border border-white/10 rounded-xl p-5 hover:border-[#00C805]/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00C805" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors">{market.id.replace('PERP-', '').replace(/-/g, ' ')}</h2>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-white/60">{market.max_leverage}x</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/50">Initial Margin</span>
                      <span className="font-mono text-white/80">{(Number(market.initial_margin_rate) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/50">Maint. Margin</span>
                      <span className="font-mono text-white/80">{(Number(market.maintenance_margin_rate) * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[#00C805] text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Trade Now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            
            {markets.length === 0 && (
              <div className="col-span-full text-center py-12 text-white/40 bg-white/5 rounded-xl border border-white/5 border-dashed">
                No active perpetual markets found on Testnet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

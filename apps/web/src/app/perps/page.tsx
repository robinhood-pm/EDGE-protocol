"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { BarChart3, TrendingUp, CloudRain } from 'lucide-react';

export default function PerpsDashboard() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const network = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Optional: we could add CategoryTabs here in the future to match exactly */}
      <div className="border-b border-border bg-card/30 backdrop-blur-xl sticky top-[73px] z-40">
        <div className="container max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <button className="whitespace-nowrap pb-4 pt-4 px-1 border-b-2 border-primary text-primary font-medium transition-colors">
            All Perpetual Markets
          </button>
        </div>
      </div>

      <main className="flex-1 container max-w-screen-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trade Probabilities</h1>
            <p className="text-muted mt-1">Go Long or Short on prediction markets with up to 10x leverage.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 h-[220px] overflow-hidden flex flex-col relative animate-pulse">
                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div className="h-6 bg-white/10 rounded w-5/6" />
                  <div className="h-4 bg-white/10 rounded w-4/6" />
                  <div className="mt-auto flex gap-2">
                    <div className="h-10 bg-white/10 rounded flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center border border-border border-dashed rounded-2xl bg-white/5">
             <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-muted">
               <BarChart3 className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold mb-2">No Markets Available</h3>
             <p className="text-muted text-sm max-w-sm mx-auto mb-6">
               There are currently no active perpetual markets on Testnet.
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {markets.map((market) => {
              // Parse our new formatted markets
              const isWeather = market.id.includes('WEATHER') || market.id.includes('RAIN') || market.id.includes('TEMP') || market.id.includes('SNOW') || market.id.includes('FIRE') || market.id.includes('FLOOD') || market.id.includes('TYP3');
              
              return (
              <Link key={market.id} href={`/perps/${market.id}`} className="block h-full">
                <div className="rounded-xl border border-border bg-card hover:bg-white/[0.02] hover:border-white/20 transition-all group relative overflow-hidden flex flex-col h-full">
                  
                  {/* Background pattern/icon */}
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    {isWeather ? (
                       <CloudRain className="w-24 h-24 text-primary" />
                    ) : (
                       <TrendingUp className="w-24 h-24 text-primary" />
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary">
                           {isWeather ? 'Weather Perp' : 'Crypto Perp'}
                         </span>
                         <span className="px-2 py-0.5 rounded text-[10px] font-mono text-muted bg-white/5">
                           {market.max_leverage}x
                         </span>
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-white/90 group-hover:text-white transition-colors leading-tight mb-4">
                      {/* For our seeded markets we don't have description in the DB easily fetched here unless we joined, so we format the ID nicely */}
                      {market.id.replace('PERP-', '').replace(/-/g, ' ')}
                    </h2>
                    
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between items-center text-sm py-1.5 border-t border-border/50">
                        <span className="text-muted">Initial Margin</span>
                        <span className="font-mono text-white/80">{(Number(market.initial_margin_rate) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1.5 border-t border-border/50">
                        <span className="text-muted">Maint. Margin</span>
                        <span className="font-mono text-white/80">{(Number(market.maintenance_margin_rate) * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex justify-between items-center">
                      <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Trade Now →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </main>
    </div>
  );
}

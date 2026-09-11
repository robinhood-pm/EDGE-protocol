"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { usePerpMarket } from '@/hooks/usePerpMarket';
import { useSignPerpOrder } from '@/lib/web3/signature';
import { useAccount } from 'wagmi';

export default function PerpTradingTerminal() {
  const { marketId } = useParams();
  const { address } = useAccount();
  const { marketStats, orderbook, positions } = usePerpMarket(marketId as string);
  const { signOrder } = useSignPerpOrder();

  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (!address || !size || !price) return;
    setIsSubmitting(true);
    
    try {
      // Calculate Margin = (Size * Price) / Leverage
      const margin = (Number(size) * Number(price)) / Number(leverage);
      
      const orderData = {
        maker: address,
        marketId: marketId as string,
        isLong: side === 'LONG',
        size,
        price,
        margin: margin.toString(),
        leverage,
        nonce: Date.now(),
        expiration: Date.now() + 86400000 // +1 day
      };

      // 1. Sign via Wallet
      const signature = await signOrder(orderData);

      // 2. Post to backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const network = process.env.NEXT_PUBLIC_NETWORK;
      const res = await fetch(`${apiUrl}/api/perps/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, signature, side, network })
      });

      const data = await res.json();
      if (data.success) {
        alert("Order submitted successfully!");
        setSize('');
        setPrice('');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error signing/submitting: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPositive = marketStats?.currentFundingRate >= 0;
  const themeColor = isPositive ? '#00C805' : '#FF5000';

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 max-w-[1600px] mx-auto w-full">
        {/* LEFT COLUMN: Chart & Stats */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Market Header */}
          <div className="flex justify-between items-end pb-4 border-b border-white/10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{marketId ? (marketId as string).replace('PERP-', '').replace(/-/g, ' ') : 'Loading...'}</h1>
              <p className="text-white/50">Perpetual Contract</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono" style={{ color: themeColor }}>
                ${marketStats?.currentMarkPrice ? Number(marketStats.currentMarkPrice).toFixed(4) : '0.0000'}
              </div>
              <div className="text-sm text-white/50">Mark Price</div>
            </div>
          </div>

          {/* Dummy Robinhood SVG Sparkline */}
          <div className="h-64 md:h-96 w-full flex items-center justify-center relative border border-white/5 rounded-xl overflow-hidden group">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmZmZmMDgiIGZpbGw9Im5vbmUiPjxwb2x5Z29uIHBvaW50cz0iMCAwIDQwIDAgNDAgNDAgMCA0MCIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none" className="z-10">
              <path d="M0 250 L100 220 L200 240 L300 180 L400 200 L500 100 L600 150 L700 80 L800 110 L900 40 L1000 60" 
                    fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Gradient Fill under the line */}
              <path d="M0 250 L100 220 L200 240 L300 180 L400 200 L500 100 L600 150 L700 80 L800 110 L900 40 L1000 60 L1000 300 L0 300 Z" 
                    fill={`url(#gradient-${themeColor.replace('#', '')})`} opacity="0.2" />
              <defs>
                <linearGradient id={`gradient-${themeColor.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={themeColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-20">
               <span className="bg-white/10 px-4 py-2 rounded-full font-mono text-sm border border-white/20">Chart Interactive Mode (WIP)</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#070709] border border-white/5 rounded-xl text-sm">
            <div>
              <div className="text-white/40 mb-1">Index Price</div>
              <div className="font-mono text-white/90">${marketStats?.currentIndexPrice ? Number(marketStats.currentIndexPrice).toFixed(4) : '0.0000'}</div>
            </div>
            <div>
              <div className="text-white/40 mb-1">Funding Rate (1h)</div>
              <div className="font-mono" style={{ color: themeColor }}>
                {marketStats?.currentFundingRate ? (Number(marketStats.currentFundingRate) * 100).toFixed(4) : '0.0000'}%
              </div>
            </div>
            <div>
              <div className="text-white/40 mb-1">Max Leverage</div>
              <div className="font-mono text-white/90">{marketStats?.max_leverage || '1'}x</div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-4">Your Positions</h3>
            {positions.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="text-white/40 border-b border-white/10">
                  <tr>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Entry Price</th>
                    <th className="pb-2">Liq. Price</th>
                    <th className="pb-2 text-right">Unrealized PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map(p => (
                    <tr key={p.id}>
                      <td className={`py-3 font-medium ${p.side === 'LONG' ? 'text-[#00C805]' : 'text-[#FF5000]'}`}>{p.side}</td>
                      <td className="py-3 font-mono">{p.size}</td>
                      <td className="py-3 font-mono">${Number(p.entry_price).toFixed(4)}</td>
                      <td className="py-3 font-mono text-white/60">--</td>
                      <td className="py-3 font-mono text-right text-white/60">--</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-white/30 border border-white/5 border-dashed rounded-xl">
                No open positions
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Entry & Orderbook */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col gap-4">
          
          {/* Order Entry */}
          <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-2xl">
            <div className="flex rounded-lg overflow-hidden bg-white/5 mb-6 p-1">
              <button 
                onClick={() => setSide('LONG')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${side === 'LONG' ? 'bg-[#00C805] text-black' : 'text-white/60 hover:text-white'}`}
              >
                Buy / Long
              </button>
              <button 
                onClick={() => setSide('SHORT')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${side === 'SHORT' ? 'bg-[#FF5000] text-black' : 'text-white/60 hover:text-white'}`}
              >
                Sell / Short
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Size (Contracts)</label>
                <input 
                  type="number" 
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-white/30 focus:outline-none" 
                  placeholder="0.0" 
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Limit Price ($)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg p-3 text-white font-mono focus:border-white/30 focus:outline-none" 
                  placeholder="0.0000" 
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 flex justify-between">
                  <span>Leverage</span>
                  <span className="font-mono text-white/90">{leverage}x</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max={marketStats?.max_leverage || "10"} 
                  step="1"
                  value={leverage}
                  onChange={e => setLeverage(e.target.value)}
                  className="w-full accent-white" 
                />
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Required Margin</span>
                  <span className="font-mono text-white/90">
                    ${(Number(size || 0) * Number(price || 0) / Number(leverage)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Trading Fee (0.1%)</span>
                  <span className="font-mono text-white/90">
                    ${(Number(size || 0) * Number(price || 0) * 0.001).toFixed(4)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSubmitOrder}
                disabled={isSubmitting || !address}
                className="w-full py-4 mt-4 rounded-xl font-bold text-black transition-opacity disabled:opacity-50"
                style={{ backgroundColor: side === 'LONG' ? '#00C805' : '#FF5000' }}
              >
                {isSubmitting ? 'Signing...' : !address ? 'Connect Wallet' : `Review ${side} Order`}
              </button>
            </div>
          </div>

          {/* Orderbook */}
          <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 flex-1 shadow-2xl flex flex-col">
            <h3 className="font-semibold text-sm mb-4 text-white/70">Orderbook</h3>
            
            <div className="flex justify-between text-xs text-white/40 mb-2 px-1">
              <span>Price</span>
              <span>Size</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-sm pr-1 custom-scrollbar">
              {/* Asks (Shorts) - Reverse order to show lowest ask at bottom of red section */}
              <div className="flex flex-col-reverse justify-end gap-1 mb-2">
                {orderbook.asks?.slice(0, 8).map((ask, i) => (
                  <div key={i} className="flex justify-between relative py-1 px-1 group cursor-pointer hover:bg-white/5 rounded">
                    <div className="absolute inset-y-0 right-0 bg-[#FF5000]/10 z-0 transition-all" style={{ width: `${Math.min(100, Number(ask.size) * 10)}%` }}></div>
                    <span className="text-[#FF5000] z-10 relative">{Number(ask.price).toFixed(4)}</span>
                    <span className="text-white/80 z-10 relative">{Number(ask.size).toFixed(1)}</span>
                  </div>
                ))}
              </div>

              {/* Spread Indicator */}
              <div className="py-2 text-center text-xs text-white/30 border-y border-white/5 mb-2">
                Spread: {
                  orderbook.asks?.[0] && orderbook.bids?.[0] 
                    ? (Number(orderbook.asks[0].price) - Number(orderbook.bids[0].price)).toFixed(4)
                    : '--'
                }
              </div>

              {/* Bids (Longs) */}
              <div className="flex flex-col gap-1">
                {orderbook.bids?.slice(0, 8).map((bid, i) => (
                  <div key={i} className="flex justify-between relative py-1 px-1 group cursor-pointer hover:bg-white/5 rounded">
                    <div className="absolute inset-y-0 right-0 bg-[#00C805]/10 z-0 transition-all" style={{ width: `${Math.min(100, Number(bid.size) * 10)}%` }}></div>
                    <span className="text-[#00C805] z-10 relative">{Number(bid.price).toFixed(4)}</span>
                    <span className="text-white/80 z-10 relative">{Number(bid.size).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}

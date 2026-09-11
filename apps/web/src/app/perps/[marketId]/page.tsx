"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { usePerpMarket } from '@/hooks/usePerpMarket';
import { useSignPerpOrder } from '@/lib/web3/signature';
import { useAccount } from 'wagmi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function PerpTradingTerminal() {
  const { marketId } = useParams();
  const { address } = useAccount();
  const { marketStats, priceHistory, orderbook, positions, fetchPositions } = usePerpMarket(marketId as string);
  const { signOrder } = useSignPerpOrder();

  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; success: boolean; message: string; orderId?: string }>({ show: false, success: false, message: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address) {
      fetchPositions(address);
    }
  }, [address, fetchPositions]);

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
        body: JSON.stringify({ ...orderData, trader: address, signature, side, network })
      });

      const data = await res.json();
      if (data.success) {
        setModal({ show: true, success: true, message: 'Order submitted successfully!', orderId: data.orderId });
        setSize('');
        setPrice('');
      } else {
        setModal({ show: true, success: false, message: data.error });
      }
    } catch (err: any) {
      setModal({ show: true, success: false, message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fill price with current mark price on first load
  useEffect(() => {
    if (marketStats?.currentMarkPrice && !price) {
      setPrice(Number(marketStats.currentMarkPrice).toFixed(2));
    }
  }, [marketStats?.currentMarkPrice]);

  // Determine Chart Color
  const firstPrice = priceHistory && priceHistory.length > 0 ? Number(priceHistory[0].price) : 0;
  const latestPrice = priceHistory && priceHistory.length > 0 ? Number(priceHistory[priceHistory.length - 1].price) : 0;
  const isPositive = latestPrice >= firstPrice;
  const themeColor = isPositive ? '#00C805' : '#FF5000';

  // Prepare chart data for recharts
  const chartData = (priceHistory || []).map((p: any, i: number) => ({
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: Number(p.price),
    index: i
  }));
  const totalPoints = chartData.length;
  const lastPoint = totalPoints > 0 ? chartData[totalPoints - 1] : null;

  // Custom dot: only render on the LAST data point
  const renderDot = (props: any) => {
    const { cx, cy, index } = props;
    if (index !== totalPoints - 1) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={themeColor} stroke="#000" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={10} fill={themeColor} opacity={0.3} className="animate-pulse" />
        <text x={cx + 14} y={cy + 4} fill={themeColor} fontWeight="bold" fontSize={12}>
          {lastPoint ? `$${Number(lastPoint.price).toFixed(2)}` : ''}
        </text>
      </g>
    );
  };

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

          {/* Real-time Price Chart */}
          <div className="h-64 md:h-96 w-full relative border border-white/5 rounded-xl overflow-hidden">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmZmZmMDgiIGZpbGw9Im5vbmUiPjxwb2x5Z29uIHBvaW50cz0iMCAwIDQwIDAgNDAgNDAgMCA0MCIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 70, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="perpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px' }}
                  labelStyle={{ color: '#888', fontSize: 11 }}
                  itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={themeColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#perpGradient)"
                  dot={renderDot}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
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
                    <th className="pb-2">Market</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Entry Price</th>
                    <th className="pb-2">Liq. Price</th>
                    <th className="pb-2 text-right">Unrealized PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.map(p => {
                    const entry = Number(p.entry_price);
                    const size = Number(p.size);
                    const lev = Number(p.leverage) || 1;
                    const mmr = Number(marketStats?.maintenance_margin_rate || 0.05);
                    const markPrice = Number(marketStats?.currentMarkPrice || marketStats?.currentIndexPrice || entry);
                    
                    let pnl = 0;
                    let liqPrice = 0;
                    
                    if (p.side === 'LONG') {
                      pnl = (markPrice - entry) * size;
                      liqPrice = entry * (1 - 1/lev + mmr);
                    } else {
                      pnl = (entry - markPrice) * size;
                      liqPrice = entry * (1 + 1/lev - mmr);
                    }
                    
                    return (
                      <tr key={p.id}>
                        <td className="py-3 font-semibold text-white/90">
                          {p.market_id.replace('PERP-', '').replace(/-/g, ' ')}
                        </td>
                        <td className={`py-3 font-medium ${p.side === 'LONG' ? 'text-[#00C805]' : 'text-[#FF5000]'}`}>{p.side}</td>
                        <td className="py-3 font-mono">{p.size}</td>
                        <td className="py-3 font-mono">${entry.toFixed(4)}</td>
                        <td className="py-3 font-mono text-white/80">${liqPrice.toFixed(4)}</td>
                        <td className={`py-3 font-mono text-right ${pnl >= 0 ? 'text-[#00C805]' : 'text-[#ef4444]'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Order Result Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal({ ...modal, show: false })}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              {modal.success ? (
                <div className="w-16 h-16 rounded-full bg-[#00C805]/10 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C805" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FF5000]/10 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center mb-2" style={{ color: modal.success ? '#00C805' : '#FF5000' }}>
              {modal.success ? 'Order Submitted' : 'Order Failed'}
            </h3>
            <p className="text-white/60 text-center text-sm mb-5">{modal.message}</p>

            {/* Order ID (copyable) */}
            {modal.success && modal.orderId && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5">
                <p className="text-xs text-white/40 mb-1">Order ID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-white/80 break-all">{modal.orderId}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(modal.orderId || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex-shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{ backgroundColor: modal.success ? '#00C805' : '#FF5000', color: '#000' }}
            >
              {modal.success ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

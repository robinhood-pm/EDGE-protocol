"use client";

import React, { use, useEffect, useState } from 'react';
import { Header } from '@/components/organisms/Header';
import { CategoryTabs } from '@/components/organisms/CategoryTabs';
import { TradePanel } from '@/components/organisms/TradePanel';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Share, Settings, Settings2, Loader2 } from 'lucide-react';
import { MarketDetail } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, Label } from 'recharts';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'react-hot-toast';
import { FloatingTransactions } from '@/components/organisms/FloatingTransactions';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const marketId = resolvedParams.slug;
  const [activeTab, setActiveTab] = useState<'orderbook' | 'positions' | 'orders' | 'resolution'>('orderbook');
  const [chartRange, setChartRange] = useState<'1H' | '6H' | '24H' | '7D' | 'ALL'>('24H');
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Query for Market Data
  const { data: market, isLoading, error, refetch } = useQuery({
    queryKey: ['market', marketId],
    queryFn: async () => {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${backendUrl}/api/markets/${marketId}`);
      if (!res.ok) throw new Error('Failed to fetch market');
      return res.json() as Promise<MarketDetail>;
    }
  });

  // Query for Live Trades
  const { data: tradesData, refetch: refetchTrades } = useQuery({
    queryKey: ['trades', marketId, chartRange],
    queryFn: async () => {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${backendUrl}/api/markets/${marketId}/trades?range=${chartRange}`);
      if (!res.ok) throw new Error('Failed to fetch trades');
      return res.json();
    },
    refetchInterval: 1500, // Poll every 1.5s for near-realtime chart updates
  });

  useEffect(() => {
    if (!market) return;
    
    // Subscribe to realtime orders for this market
    const ordersChannel = supabase
      .channel(`orders-${market.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `market_id=eq.${market.id}` },
        (payload) => {
          console.log('Order changed:', payload);
          refetch(); // Refetch orderbook
        }
      )
      .subscribe();

    // Subscribe to realtime trades for this market
    const tradesChannel = supabase
      .channel(`trades-${market.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades', filter: `market_id=eq.${market.id}` },
        (payload) => {
          console.log('New trade:', payload);
          refetchTrades(); // Refetch chart data
          refetch(); // Also refetch market data (volume, etc)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [marketId, refetch, refetchTrades, market]);

  // Query for Open Orders
  const { data: openOrders, refetch: refetchOpenOrders } = useQuery({
    queryKey: ['openOrders', marketId, address],
    queryFn: async () => {
      if (!address) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('wallet_address', address)
        .eq('status', 'PENDING');
      if (error) throw error;
      return data;
    },
    enabled: !!address && !!marketId
  });

  const handleCancelOrder = async (orderId: string) => {
    if (!address) return;
    try {
      setCancelingOrderId(orderId);
      const message = `Cancel Order ${orderId}`;
      const signature = await signMessageAsync({ message });

      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${backendUrl}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, wallet_address: address }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      refetchOpenOrders();
      refetch();
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('User rejected') || e.name === 'UserRejectedRequestError') {
        toast.error('Signature rejected. Order was not cancelled.');
      } else {
        toast.error(e.message || 'Error cancelling order');
      }
    } finally {
      setCancelingOrderId(null);
    }
  };

  // Query for Positions
  const { data: positions } = useQuery({
    queryKey: ['portfolio', address, marketId],
    queryFn: async () => {
      if (!address) return null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/portfolio/${address}`);
      const json = await res.json();
      return json.positions?.find((p: any) => p.marketId === marketId) || null;
    },
    enabled: !!address && !!marketId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-red-500">Error loading market</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CategoryTabs />

      <main className="flex-1 container max-w-screen-2xl mx-auto px-4 py-6">
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Left Column (Main Info & Chart) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            {/* Market Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center shadow-sm overflow-hidden p-2">
                  <img src={market.image} alt={market.title} className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted font-medium">
                    <span>{market.closeTimeFormatted}</span>
                    <span>Total Vol ${market.totalVolume.toLocaleString()}</span>
                    {market.status === 'Live' && (
                      <span className="flex items-center gap-1 text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{market.title}</h1>
                </div>
              </div>
              <Button variant="outline" className="h-9 gap-2">
                Share <Share className="w-4 h-4" />
              </Button>
            </div>

            {/* Prices & Timer */}
            <div className="flex items-end justify-between border-b border-border pb-4">
              <div className="flex gap-12">
                <div>
                  <div className="text-sm text-muted mb-1">Price to Beat</div>
                  <div className="text-xl font-bold">${market.priceToBeat.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1 flex items-center gap-1">
                    Current Price <span className={market.priceChangePercent >= 0 ? 'text-yes' : 'text-no'}>
                      {market.priceChangePercent >= 0 ? '▲' : '▼'} {Math.abs(market.priceChangePercent)}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-no flex items-center gap-2">
                    ${market.currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-no/20 text-xs">⏱</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted mb-1">Min <span className="mx-2">Sec</span></div>
                <div className="text-2xl font-bold font-mono text-no">{market.timeLeft}</div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex items-center gap-2 mb-2">
              {['1H', '6H', '24H', '7D', 'ALL'].map(range => (
                <button
                  key={range}
                  onClick={() => setChartRange(range as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartRange === range ? 'bg-neutral-800 text-white' : 'text-muted hover:text-white hover:bg-neutral-800/50'}`}
                >
                  {range}
                </button>
              ))}
            </div>
            <div className="h-80 w-full relative">
              <FloatingTransactions realTrades={tradesData?.trades || []} />
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const rawData = tradesData?.trades?.length > 0 ? tradesData.trades : market.chartData;
                  const data = [...(rawData || [])];
                  const totalPoints = data.length;
                  const lastPoint = totalPoints > 0 ? data[totalPoints - 1] : null;

                  // Custom dot: only render on the LAST data point
                  const renderDot = (props: any) => {
                    const { cx, cy, index } = props;
                    if (index !== totalPoints - 1) return null;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#1c1c1c" strokeWidth={2} />
                        <text x={cx + 10} y={cy + 4} fill="#10b981" fontWeight="bold" fontSize={12} className="animate-pulse">
                          {lastPoint ? `${Number(lastPoint.price).toFixed(1)}¢` : ''}
                        </text>
                      </g>
                    );
                  };

                  return (
                    <AreaChart data={data} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #333' }}
                        labelStyle={{ color: '#888' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${Number(value).toFixed(1)}¢`, 'Price']}
                      />
                      <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" dot={renderDot} isAnimationActive={false} />
                    </AreaChart>
                  );
                })()}
              </ResponsiveContainer>
            </div>

            {/* Tabs & Orderbook */}
            <div>
              <div className="flex border-b border-border gap-6">
                <button onClick={() => setActiveTab('orderbook')} className={`px-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'orderbook' ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>Order Book</button>
                <button onClick={() => setActiveTab('positions')} className={`px-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'positions' ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>My Positions</button>
                <button onClick={() => setActiveTab('orders')} className={`px-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'orders' ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>Open Orders</button>
                <button onClick={() => setActiveTab('resolution')} className={`px-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'resolution' ? 'border-foreground text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}>Resolution</button>
              </div>
              
              <div className="py-6">
                {activeTab === 'orderbook' && (
                  <>
                    <div className="grid grid-cols-[100px_1fr_100px] gap-4 text-xs font-medium text-muted mb-4 border-b border-border pb-2">
                      <div>Price</div>
                      <div className="text-right">Shares</div>
                      <div className="text-right">Total</div>
                    </div>
                    
                    {/* Asks (NO) */}
                    <div className="flex flex-col gap-1 mb-6 text-sm font-mono">
                      {market.orderBook.asks.slice().reverse().map((ask, i) => (
                        <div key={i} className="grid grid-cols-[100px_1fr_100px] gap-4 relative">
                          <div className="absolute top-0 right-0 h-full bg-no/10" style={{width: `${(ask.total / 150) * 100}%`}} />
                          <div className="text-no z-10">{Number(ask.price).toFixed(1)}¢</div>
                          <div className="text-right z-10">{Number(ask.shares).toFixed(1)}</div>
                          <div className="text-right z-10">${ask.total.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted my-2 border-y border-border py-2">
                      <span>Last: {(market.currentPrice * 100).toFixed(1)}¢</span>
                      <span>Spread: {market.orderBook.asks[0]?.price && market.orderBook.bids[0]?.price ? `${Number(market.orderBook.asks[0].price - market.orderBook.bids[0].price).toFixed(1)}¢` : 'N/A'}</span>
                    </div>

                    {/* Bids (YES) */}
                    <div className="flex flex-col gap-1 text-sm font-mono">
                      {market.orderBook.bids.map((bid, i) => (
                        <div key={i} className="grid grid-cols-[100px_1fr_100px] gap-4 relative">
                          <div className="absolute top-0 right-0 h-full bg-yes/10" style={{width: `${(bid.total / 150) * 100}%`}} />
                          <div className="text-yes z-10">{Number(bid.price).toFixed(1)}¢</div>
                          <div className="text-right z-10">{Number(bid.shares).toFixed(1)}</div>
                          <div className="text-right z-10">${bid.total.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === 'positions' && (
                  <div className="py-4 text-sm">
                    {!address ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <div className="text-sm text-muted">Connect your wallet to view positions</div>
                        <ConnectButton />
                      </div>
                    ) : !positions ? (
                      <div className="text-center text-muted py-8">No positions found for this market.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 border border-border p-4 rounded-lg bg-card text-center">
                         <div>
                           <div className="text-muted text-xs mb-1">YES Shares</div>
                           <div className="text-yes font-mono text-lg">{positions.yesShares}</div>
                         </div>
                         <div>
                           <div className="text-muted text-xs mb-1">NO Shares</div>
                           <div className="text-no font-mono text-lg">{positions.noShares}</div>
                         </div>
                         <div>
                           <div className="text-muted text-xs mb-1">Total Invested</div>
                           <div className="font-mono text-lg">${positions.totalInvested.toFixed(2)}</div>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="py-4">
                    {!address ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <div className="text-sm text-muted">Connect your wallet to view open orders</div>
                        <ConnectButton />
                      </div>
                    ) : !openOrders || openOrders.length === 0 ? (
                      <div className="text-center text-sm text-muted py-8">No open orders found.</div>
                    ) : (
                      <div className="flex flex-col gap-2 font-mono text-sm">
                        <div className="grid grid-cols-[80px_1fr_100px_80px] text-xs text-muted pb-2 border-b border-border">
                          <div>Side</div>
                          <div className="text-right">Shares</div>
                          <div className="text-right">Price</div>
                          <div className="text-right">Action</div>
                        </div>
                        {openOrders.map(order => (
                          <div key={order.id} className="grid grid-cols-[80px_1fr_100px_80px] items-center py-2 border-b border-border/30">
                            <div className={order.side === 'YES' ? 'text-yes font-bold' : 'text-no font-bold'}>{order.side}</div>
                            <div className="text-right">{Number(order.amount).toFixed(1)}</div>
                            <div className="text-right">{(order.price / 100).toFixed(1)}¢</div>
                            <div className="text-right">
                              <button 
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancelingOrderId === order.id}
                                className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50"
                              >
                                {cancelingOrderId === order.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'resolution' && (
                  <div className="text-sm text-muted py-4">
                    <p>Market resolution rules dictate how the market will be settled.</p>
                    <div className="mt-4 p-4 bg-card border border-border rounded-lg text-foreground/80">
                      {market.resolutionRules}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-card rounded-xl p-6 border border-border mt-4">
              <h3 className="font-bold text-lg mb-4">Rules</h3>
              <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                {market.resolutionRules}
              </div>
            </div>
            
          </div>

          {/* Right Column (Trading Terminal) */}
          <aside className="w-full xl:w-[360px] flex-shrink-0">
            <div className="sticky top-20 flex flex-col gap-4">
              
              {/* Terminal Box via Wagmi */}
              <TradePanel market={market} />

              {/* Rewards Box */}
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-muted font-medium">Current LP Rewards</span>
                  <Badge variant="live" className="text-[10px] h-5 px-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live</Badge>
                </div>
                <div className="text-2xl font-bold text-yellow-500 flex items-center gap-1 mb-1">
                  {market.rewards.pointsToEarn} <span className="text-sm border border-yellow-500/30 rounded px-1">PP</span>
                </div>
                <div className="text-sm font-medium mb-3">to be earned</div>
                <a href="#" className="text-xs text-white/70 hover:text-white hover:underline">How It Works →</a>
              </div>

            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { Header } from '@/components/organisms/Header';
import { CategoryTabs } from '@/components/organisms/CategoryTabs';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Share, Settings, Settings2 } from 'lucide-react';
import marketDetailData from '@/data/market_detail.json';
import { MarketDetail } from '@/types';

export default function MarketPage() {
  const market = marketDetailData as MarketDetail;

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
                <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center text-4xl shadow-sm">
                  {market.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted font-medium">
                    <span>Sep 9, 10:15 AM – 10:30AM</span>
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
                    Current Price <span className="text-no flex items-center">▼ {Math.abs(market.priceChangePercent)}%</span>
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

            {/* Chart Area (Placeholder) */}
            <div className="h-80 w-full relative">
              <div className="absolute left-0 bottom-12 w-full flex flex-col gap-4 text-xs font-mono text-muted">
                <div className="flex justify-between items-center border-b border-border/50 border-dashed pb-1">
                  <span className="text-yes">+$6</span> <span>$78,595</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 border-dashed pb-1">
                  <span className="text-yes">+$3</span> <span>$78,592</span>
                </div>
                <div className="flex justify-between items-center border-b border-muted border-dashed pb-1">
                  <span className="text-yes">+$2</span> 
                  <span className="bg-muted text-background px-1.5 rounded">Target</span>
                </div>
              </div>
              {/* Fake chart line */}
              <svg className="w-full h-full absolute inset-0 z-10" preserveAspectRatio="none">
                <path d="M0,150 L200,150 L250,80 L350,80 L400,120 L800,120 L900,120" fill="none" stroke="currentColor" strokeWidth="2" className="text-no" />
                <circle cx="800" cy="120" r="4" className="fill-no" />
              </svg>
            </div>

            {/* Tabs & Orderbook */}
            <div>
              <div className="flex border-b border-border gap-6">
                <button className="px-1 py-3 text-sm font-medium border-b-2 border-foreground text-foreground">Order Book</button>
                <button className="px-1 py-3 text-sm font-medium text-muted hover:text-foreground">My Positions</button>
                <button className="px-1 py-3 text-sm font-medium text-muted hover:text-foreground">Open Orders</button>
                <button className="px-1 py-3 text-sm font-medium text-muted hover:text-foreground">Resolution</button>
              </div>
              
              <div className="py-6">
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
                      <div className="text-no z-10">{ask.price}¢</div>
                      <div className="text-right z-10">{ask.shares}</div>
                      <div className="text-right z-10">${ask.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-muted my-2 border-y border-border py-2">
                  <span>Last: 36¢</span>
                  <span>Spread: 1¢</span>
                </div>

                {/* Bids (YES) */}
                <div className="flex flex-col gap-1 text-sm font-mono">
                  {market.orderBook.bids.map((bid, i) => (
                    <div key={i} className="grid grid-cols-[100px_1fr_100px] gap-4 relative">
                      <div className="absolute top-0 right-0 h-full bg-yes/10" style={{width: `${(bid.total / 150) * 100}%`}} />
                      <div className="text-yes z-10">{bid.price}¢</div>
                      <div className="text-right z-10">{bid.shares}</div>
                      <div className="text-right z-10">${bid.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
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
              
              {/* Terminal Box */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-background border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-xs">🪙</div>
                    <span className="font-bold text-sm truncate w-40">{market.title}</span>
                  </div>
                  <span className="text-yes font-bold text-sm">Up</span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4 text-sm font-medium border-b border-border pb-4 mb-4">
                    <button className="text-foreground">Buy</button>
                    <button className="text-muted hover:text-foreground">Sell</button>
                    <div className="ml-auto flex items-center gap-2 text-muted">
                      <span>1-Tap</span> <Settings2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Button variant="yes" className="h-12 text-sm font-bold shadow-sm shadow-yes/20">UP 36¢</Button>
                    <Button variant="secondary" className="h-12 text-sm font-bold text-foreground">DOWN 65¢</Button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">One-tap Buy</span>
                    <button className="text-xs text-muted hover:text-foreground">✎ Edit</button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <button className="bg-background border border-border rounded-lg py-2 flex flex-col items-center hover:bg-neutral-800 transition-colors">
                      <span className="font-bold">$5</span>
                      <span className="text-[10px] text-muted">Win <span className="text-yes">$14</span></span>
                    </button>
                    <button className="bg-background border border-border rounded-lg py-2 flex flex-col items-center hover:bg-neutral-800 transition-colors">
                      <span className="font-bold">$25</span>
                      <span className="text-[10px] text-muted">Win <span className="text-yes">$68</span></span>
                    </button>
                    <button className="bg-background border border-border rounded-lg py-2 flex flex-col items-center hover:bg-neutral-800 transition-colors">
                      <span className="font-bold">$100</span>
                      <span className="text-[10px] text-muted">Win <span className="text-yes">$260</span></span>
                    </button>
                  </div>

                  <div className="text-center text-xs text-red-500 font-medium mb-4">Insufficient Funds</div>
                  
                  <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-border">
                    <span className="text-muted">Balance</span>
                    <span>$0.00</span>
                  </div>
                </div>
              </div>

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
                <a href="#" className="text-xs text-blue-400 hover:underline">How It Works →</a>
              </div>

            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import LightRays from '@/components/LightRays';
import GlassSurface from '@/components/GlassSurface';

// EDGE Protocol Contract Address (CA)
const EDGE_CA = process.env.NEXT_PUBLIC_EDGE_CA!;

export const LandingHero = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCA = async () => {
    try {
      await navigator.clipboard.writeText(EDGE_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = EDGE_CA;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <section className="relative pt-36 pb-20 px-6 flex flex-col items-center overflow-hidden">
      {/* LightRays Background */}
      <div className="absolute top-10 left-0 w-full h-[1200px] pointer-events-none" style={{ zIndex: 0 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="white"
          raysSpeed={0.7}
          lightSpread={1.9}
          rayLength={4.2}
          pulsating={true}
          fadeDistance={1.1}
          saturation={1}
          followMouse={true}
          mouseInfluence={0.2}
          noiseAmount={0}
          distortion={0}
        />
      </div>

      <div className="text-center max-w-3xl mx-auto mb-14 mt-10 relative z-10">
        {/* Contract Address (CA) - Click to Copy */}
        <button
          onClick={handleCopyCA}
          className="mb-6 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4 py-2 mx-auto transition-all duration-200 group cursor-pointer"
          title="Click to copy Contract Address"
        >
          <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">CA</span>
          <span className="text-[12px] text-white/70 font-mono group-hover:text-white transition-colors">
            {EDGE_CA}
          </span>
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 group-hover:text-white/60 transition-colors"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          )}
          {copied && <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>}
        </button>

        <h1 className="text-[52px] md:text-[68px] font-semibold tracking-[-0.03em] leading-[1.05] mb-6">
          Predict the Future <br /> With EDGE.
        </h1>
        <p className="text-[15px] text-white/50 max-w-xl mx-auto leading-relaxed mb-8">
          A prediction market built natively on Robinhood Chain. Trade the probability of future outcomes across Equities, Crypto, Macro, and Rates.
        </p>
        <Link href="/markets">
          <button className="bg-white hover:bg-neutral-200 transition-colors text-black px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            Start Trading 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </Link>
      </div>

      {/* Hero Dashboard Graphic (High Fidelity Mock) */}
      <div className="relative z-10 w-full max-w-[1040px] mx-auto rounded-[20px] shadow-[0_30px_100px_-20px_rgba(230,201,186,0.2)]">
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={20}
          borderWidth={0.1}
          opacity={0.4}
          backgroundOpacity={0.05}
          displace={0.3}
          mixBlendMode="screen"
          className="w-full flex flex-col aspect-[16/9] md:aspect-[16/10]"
        >
          <div className="flex flex-col w-full h-full rounded-2xl overflow-hidden">
            {/* Top Bar */}
          <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-black/20 w-full">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="EDGE Protocol Logo" className="w-5 h-5 object-contain rounded-full bg-white ring-1 ring-white/80 shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                <span className="font-semibold text-sm">EDGE Protocol</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5 border border-white/5">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-[10px] font-bold">0x</div>
                <span className="text-[11px] text-white/80 font-medium">0x8a...4b92</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 h-7 rounded-full bg-black/40 border border-white/5 flex items-center px-3">
                <span className="text-white/30 text-[11px]">Search markets...</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </div>
            </div>
          </div>

          {/* Dashboard Body */}
          <div className="flex-1 flex w-full">
            {/* Sidebar */}
            <div className="w-48 border-r border-white/5 p-4 flex flex-col gap-1 bg-black/10">
              <div className="text-[10px] text-white/40 font-semibold mb-2 ml-2 uppercase tracking-wider">Markets</div>
              <div className="px-3 py-2 rounded-lg bg-white/5 text-[12px] text-white flex items-center gap-3">
                <div className="w-4 h-4 bg-white/20 rounded-sm"></div> Equities
              </div>
              <div className="px-3 py-2 rounded-lg text-[12px] text-white/50 hover:bg-white/5 flex items-center gap-3">
                <div className="w-4 h-4 border border-white/20 rounded-sm"></div> Crypto
              </div>
              <div className="px-3 py-2 rounded-lg text-[12px] text-white/50 hover:bg-white/5 flex items-center gap-3">
                <div className="w-4 h-4 border border-white/20 rounded-sm"></div> Macro
              </div>
              <div className="mt-8 text-[10px] text-white/40 font-semibold mb-2 ml-2 uppercase tracking-wider">Positions</div>
              <div className="px-3 py-2 rounded-lg bg-white/10 text-white text-[12px] flex items-center justify-between border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white"></div> Value
                </div>
                <span>$289K</span>
              </div>
              <div className="px-3 py-2 rounded-lg text-[12px] text-white/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div> Cash
                </div>
                <span>$12K</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 flex flex-col gap-4">
              
              {/* Top Row Widgets */}
              <div className="flex gap-4">
                {/* Big Chart */}
                <div className="flex-[2] bg-white/5 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="text-[13px] text-white/50 mb-1">Total Position Value</div>
                      <div className="text-3xl font-semibold mb-2">$45.5K</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> In profit
                        </span>
                        <span className="text-[11px] text-green-400">+3.48%</span>
                      </div>
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                      <div className="px-3 py-1 rounded-md text-[11px] text-white/40 hover:text-white">24H</div>
                      <div className="px-3 py-1 rounded-md text-[11px] bg-white/10 text-white">7D</div>
                      <div className="px-3 py-1 rounded-md text-[11px] text-white/40 hover:text-white">30D</div>
                    </div>
                  </div>
                  {/* Fake Chart Lines */}
                  <div className="h-24 relative w-full mt-4">
                    {/* Purple Line */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,80 Q15,60 30,70 T60,40 T100,20" fill="none" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                    {/* Gray Line */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,90 Q20,80 40,85 T70,50 T100,70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    </svg>
                    {/* Tooltip dot */}
                    <div className="absolute left-[60%] top-[40%] w-3 h-3 bg-black border-[3px] border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute left-[60%] top-[40%] -translate-y-[150%] -translate-x-1/2 bg-white font-bold text-black text-[10px] px-2 py-1 rounded shadow-lg">
                      $50.2K
                    </div>
                  </div>
                </div>

                {/* Right Side Portfolio Widget */}
                <div className="flex-1 bg-white/5 border border-white/20 rounded-2xl p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-6 h-6 rounded-full border border-white/40"></div>
                    <div className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/70">New</div>
                  </div>
                  <div className="text-[14px] font-semibold mb-1">EDGE Portfolio</div>
                  <div className="text-[11px] text-white/50 leading-relaxed mb-6">
                    View your predicted outcomes and manage your live positions across all markets.
                  </div>
                  <div className="mt-auto space-y-2">
                    <button className="w-full bg-white/5 hover:bg-white/10 text-white/70 text-[12px] font-medium py-2 rounded-lg border border-white/5 flex justify-center items-center gap-2">
                      Withdraw Balance 
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row Wide Widget */}
              <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col">
                <div className="text-[14px] font-medium text-white/60 mb-4">Your active predictions</div>
                
                <div className="flex-1 border border-white/5 rounded-xl bg-black/20 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] text-white/40 mb-1 flex items-center gap-1">
                         Resolving in 45 minutes 
                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      </div>
                      <div className="text-xl font-semibold">BTC Up or Down 15m</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-white/40 mb-1">YES Shares Owned</div>
                      <div className="text-2xl font-bold flex items-center gap-3">
                        4,256.48 
                        <button className="bg-white text-black text-[10px] px-3 py-1 rounded font-medium">Buy More</button>
                        <button className="bg-white/10 text-[10px] px-3 py-1 rounded text-white/70 font-medium">Sell</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-white/40 mb-1">Unrealized PnL</div>
                      <div className="text-sm font-semibold">-0.22 <span className="text-[10px] text-white/40">%</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 mb-1">Current Price (YES)</div>
                      <div className="text-sm font-semibold text-red-400 flex items-center gap-1">
                        45.89¢ 
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10"/><path d="M17 7v10H7"/></svg>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 mb-1">Avg Buy Price</div>
                      <div className="text-sm font-semibold">45.60¢</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 mb-1">Market Probability</div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1.5">
                        <div className="w-[46%] h-full bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </GlassSurface>
      </div>
    </section>
  );
};

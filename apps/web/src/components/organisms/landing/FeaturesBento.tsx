import React from 'react';
import GlassSurface from '@/components/GlassSurface';

export const FeaturesBento = () => {
  return (
    <section className="py-28 px-6 max-w-5xl mx-auto relative z-10">
      <div className="text-center mb-16">
        <GlassSurface
          width="auto"
          height="auto"
          borderRadius={999}
          borderWidth={0.05}
          backgroundOpacity={0.05}
          opacity={0.3}
          className="inline-flex mb-6"
        >
          <div className="px-1 text-[11px] font-medium text-white/70 whitespace-nowrap">
            Protocol Features
          </div>
        </GlassSurface>
        <h2 className="text-[32px] md:text-[40px] font-semibold leading-tight mb-4">
          Powerful Markets Built For <br/> Robinhood Chain
        </h2>
        <p className="text-[14px] text-white/50 max-w-lg mx-auto">
          Discover how the EDGE protocol transforms decentralized predictions with deep liquidity and seamless resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Bento 1: Native to Robinhood Chain */}
        <div className="md:col-span-4 h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col h-full w-full relative z-10">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              {/* Visual */}
              <div className="h-32 mb-6 flex items-center justify-center relative">
                <div className="w-full max-w-[200px] h-14 bg-black/40 rounded-xl border border-white/5 shadow-xl flex items-center px-4 gap-3 z-10">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-black">RH</div>
                  <div>
                    <div className="text-[12px] font-medium">Native Network</div>
                    <div className="text-[10px] text-white/40">Chain ID 4663</div>
                  </div>
                </div>
                {/* Blur backdrop behind visual */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[100px] bg-white/30 blur-[40px] z-0"></div>
              </div>
              <div className="mt-auto">
                <h3 className="text-[15px] font-semibold mb-2">Built for Robinhood Chain</h3>
                <p className="text-[12px] text-white/40 leading-relaxed">Experience ultra-fast finality, low fees, and deep liquidity natively on the network.</p>
              </div>
            </div>
          </GlassSurface>
        </div>

        {/* Bento 2: Equities, Crypto & Macro */}
        <div className="md:col-span-8 h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col md:flex-row gap-6 w-full h-full relative z-10">
              <div className="absolute bottom-0 right-0 w-[400px] h-[150px] bg-white/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="flex-1 flex flex-col justify-end">
                <h3 className="text-[15px] font-semibold mb-2">Equities, Crypto & Macro</h3>
                <p className="text-[12px] text-white/40 leading-relaxed max-w-[200px]">Trade markets that matter. From stock token prices to macroeconomic policy outcomes.</p>
              </div>
              
              {/* Visual Right Side */}
              <div className="flex-1 flex flex-col gap-3 justify-center items-end pr-4 relative">
                 <div className="w-[80%] h-10 rounded-lg border border-white/10 bg-black/20 flex items-center px-3 justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border border-white/20 rounded-sm"></div>
                     <span className="text-[11px] text-white/70">Fed Cuts Rates</span>
                   </div>
                   <div className="text-[14px] text-white/30">45%</div>
                 </div>
                 
                 <div className="w-full h-10 rounded-lg border border-white/40 bg-black/40 flex items-center px-3 justify-between relative shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border border-white/50 rounded-sm bg-white/20"></div>
                     <span className="text-[11px] text-white font-medium">BTC Hits $100k</span>
                   </div>
                   <div className="w-8 h-5 rounded bg-white text-black flex items-center justify-center text-[10px] shadow-sm shadow-white">89%</div>
                   {/* Mouse Cursor */}
                   <div className="absolute -bottom-5 right-0 text-white drop-shadow-lg z-20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                   </div>
                 </div>
                 
                 <div className="w-[80%] h-10 rounded-lg border border-white/10 bg-black/20 flex items-center px-3 justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border border-white/20 rounded-sm"></div>
                     <span className="text-[11px] text-white/70">Stock Token Highs</span>
                   </div>
                   <div className="text-[14px] text-white/30">12%</div>
                 </div>
              </div>
            </div>
          </GlassSurface>
        </div>

        {/* Bento 3: Real-time Probabilities */}
        <div className="md:col-span-6 h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col w-full h-full relative z-10">
              {/* Visual area */}
              <div className="h-40 mb-6 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden p-4 flex flex-col items-center justify-center">
                 <div className="text-[10px] text-white/50 mb-3">Watch probabilities move live</div>
                 <div className="flex gap-2 mb-4 w-full px-6">
                   <div className="flex-1 py-2 rounded border border-white/10 bg-white/5 text-[10px] text-center text-white/60">30%</div>
                   <div className="flex-1 py-2 rounded border border-white/40 bg-white/10 text-[10px] text-center text-white font-medium shadow-[0_0_10px_rgba(255,255,255,0.2)]">61%</div>
                   <div className="flex-1 py-2 rounded border border-white/10 bg-white/5 text-[10px] text-center text-white/60">9%</div>
                 </div>
                 <div className="w-full px-6 flex items-center gap-2">
                    <div className="flex-1 h-8 rounded border border-white/10 bg-white/5 flex items-center px-3 text-[9px] text-white/30">Enter order amount...</div>
                    <div className="h-8 px-3 bg-white/10 rounded border border-white/5 text-[9px] flex items-center gap-1 text-white/70">
                      Buy YES 
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
                    </div>
                 </div>
                 <div className="absolute bottom-0 w-full h-[60px] bg-gradient-to-t from-white/20 to-transparent blur-[20px]"></div>
              </div>
              <h3 className="text-[15px] font-semibold mb-2">Real-time Probabilities</h3>
              <p className="text-[12px] text-white/40 leading-relaxed max-w-[280px]">Watch market-implied probabilities move in real time. Buy or sell positions instantly on the central limit order book.</p>
            </div>
          </GlassSurface>
        </div>

        {/* Bento 4: Seamless Resolution */}
        <div className="md:col-span-6 h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col justify-end w-full h-full relative z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150px] bg-white/10 blur-[50px] pointer-events-none z-0"></div>
              
              <div className="absolute top-8 left-8 right-8 flex flex-col gap-4 z-10">
                <div className="self-end bg-white text-black font-medium text-[10px] px-3 py-2 rounded-lg rounded-tr-none max-w-[200px] shadow-lg">
                  Redeem winning shares instantly
                  <div className="text-[7px] text-black/50 mt-1 uppercase">Step 2</div>
                </div>
                <div className="self-start bg-black/60 border border-white/5 text-white/80 text-[10px] px-3 py-2 rounded-lg rounded-tl-none max-w-[200px] shadow-lg">
                  <div className="text-[7px] text-white font-bold mb-1 uppercase">Step 1</div>
                  Oracle verifies the real-world outcome
                </div>
              </div>

              <h3 className="text-[15px] font-semibold mb-2 relative z-10 mt-36">Seamless Resolution</h3>
              <p className="text-[12px] text-white/40 leading-relaxed max-w-[280px] relative z-10">Experience automated market resolution and instant redemptions for winning positions without counterparty risk.</p>
            </div>
          </GlassSurface>
        </div>

      </div>
    </section>
  );
};

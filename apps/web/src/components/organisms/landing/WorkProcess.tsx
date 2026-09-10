import React from 'react';
import GlassSurface from '@/components/GlassSurface';

export const WorkProcess = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 text-center relative z-10">
      <GlassSurface
        width="auto"
        height="auto"
        borderRadius={999}
        borderWidth={0.05}
        backgroundOpacity={0.05}
        opacity={0.3}
        className="inline-flex mb-6"
      >
        <div className="px-1 flex items-center gap-2 text-[11px] font-medium text-white/70 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
          Work Process
        </div>
      </GlassSurface>
      <h2 className="text-[32px] font-semibold mb-4">Getting Started with <br/> EDGE Protocol</h2>
      <p className="text-[14px] text-white/50 max-w-md mx-auto mb-16">
        See how easy it is to start trading predictions and managing your portfolio in three simple steps.
      </p>

      <div className="container max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Step 01 */}
        <div className="h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col text-left w-full h-full relative z-10">
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#E6C9BA]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                  <span className="font-bold text-[14px]">01</span>
                </div>
                <div className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">Wallet</div>
              </div>
              <h3 className="text-[16px] font-semibold mb-3 relative z-10">Connect & Fund</h3>
              <p className="text-[12px] text-white/50 leading-relaxed mb-6 relative z-10">
                Connect your Robinhood Chain compatible wallet and ensure you have USDG tokens ready. Our native integration ensures zero friction.
              </p>
              <div className="flex gap-2 mt-auto relative z-10">
                <div className="px-3 py-1.5 rounded border border-white/10 bg-black/20 text-[10px] text-white/60">Robinhood Wallet</div>
                <div className="px-3 py-1.5 rounded border border-white/10 bg-black/20 text-[10px] text-white/60">MetaMask</div>
              </div>
            </div>
          </GlassSurface>
        </div>

        {/* Step 02 */}
        <div className="h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col text-left w-full h-full relative z-10">
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                  <span className="font-bold text-[14px]">02</span>
                </div>
                <div className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">Trade</div>
              </div>
              <h3 className="text-[16px] font-semibold mb-3 relative z-10">Predict Outcomes</h3>
              <p className="text-[12px] text-white/50 leading-relaxed mb-6 relative z-10">
                Browse global markets from crypto prices to macro events. Choose YES or NO and secure your position using the central limit order book.
              </p>
              <div className="flex gap-2 mt-auto relative z-10">
                <div className="px-3 py-1.5 rounded border border-green-500/30 bg-green-500/10 text-[10px] text-green-400">Buy YES</div>
                <div className="px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-[10px] text-red-400">Buy NO</div>
              </div>
            </div>
          </GlassSurface>
        </div>

        {/* Step 03 */}
        <div className="h-full">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={16}
            backgroundOpacity={0.03}
            opacity={0.3}
            className="w-full h-full relative group"
          >
            <div className="p-6 flex flex-col text-left w-full h-full relative z-10">
              <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                  <span className="font-bold text-[14px]">03</span>
                </div>
                <div className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">Resolve</div>
              </div>
              <h3 className="text-[16px] font-semibold mb-3 relative z-10">Instant Settlement</h3>
              <p className="text-[12px] text-white/50 leading-relaxed mb-6 relative z-10">
                Once the real-world event concludes, decentralized oracles verify the outcome. Winning shares can be redeemed instantly for USDG.
              </p>
              <div className="flex gap-2 mt-auto relative z-10">
                <div className="px-3 py-1.5 rounded border border-white/10 bg-black/20 text-[10px] text-white/60 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Oracle Verified
                </div>
              </div>
            </div>
          </GlassSurface>
        </div>

      </div>
    </section>
  );
};

import React from 'react';

export const LandingStats = () => {
  return (
    <section className="py-20 px-6 border-b border-white/5 bg-gradient-to-b from-[#070709] to-[#0a0a0f]">
      <div className="container max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center divide-x divide-white/5">
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-[36px] md:text-[44px] font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">$12.5K+</div>
            <div className="text-[13px] font-medium text-white/40 uppercase tracking-widest">Total Volume</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-[36px] md:text-[44px] font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">4,200+</div>
            <div className="text-[13px] font-medium text-white/40 uppercase tracking-widest">Predictions Made</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-[36px] md:text-[44px] font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">350+</div>
            <div className="text-[13px] font-medium text-white/40 uppercase tracking-widest">Active Traders</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-[36px] md:text-[44px] font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">24+</div>
            <div className="text-[13px] font-medium text-white/40 uppercase tracking-widest">Markets Resolved</div>
          </div>
        </div>
      </div>
    </section>
  );
};

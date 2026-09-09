import React from 'react';

export const SupportedEcosystem = () => {
  return (
    <section className="py-10 border-b border-white/5">
      <div className="container max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-left w-full md:w-auto">
          <h3 className="text-[15px] font-medium mb-1">Supported Ecosystem</h3>
          <p className="text-[13px] text-white/40">Powered by cutting-edge infrastructure</p>
        </div>
        <div className="flex gap-8 md:gap-14 opacity-40 grayscale items-center flex-wrap">
          <div className="text-lg font-bold flex items-center gap-2 tracking-tight">
            ROBINHOOD CHAIN
          </div>
          <div className="text-lg font-bold flex items-center gap-2 tracking-tight">
            USDG TOKEN
          </div>
          <div className="text-lg font-bold italic tracking-widest">
            HARDHAT
          </div>
        </div>
      </div>
    </section>
  );
};

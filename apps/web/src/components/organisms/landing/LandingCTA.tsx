import React from 'react';
import Link from 'next/link';

export const LandingCTA = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#594EE6]/20 blur-[100px] -z-10 rounded-full" />
      
      <div className="container max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.02em] leading-tight mb-6">
          Ready to Predict the Future?
        </h2>
        <p className="text-[15px] text-white/50 max-w-xl mx-auto leading-relaxed mb-10">
          Join thousands of traders on the most advanced prediction market protocol. Connect your wallet and start trading outcomes instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/markets">
            <button className="bg-white text-black hover:bg-neutral-200 transition-colors px-8 py-3.5 rounded-full text-[15px] font-bold flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Launch App
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </Link>
          <Link href="/docs" className="px-8 py-3.5 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors text-[15px] font-medium">
            Read Documentation
          </Link>
        </div>
      </div>
    </section>
  );
};

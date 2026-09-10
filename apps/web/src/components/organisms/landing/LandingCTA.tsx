import React from 'react';
import Link from 'next/link';
import GlassSurface from '@/components/GlassSurface';

export const LandingCTA = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden z-10">
      <div className="container max-w-4xl mx-auto text-center relative z-10">
        <GlassSurface
          width="100%"
          height="100%"
          borderRadius={32}
          borderWidth={0.1}
          backgroundOpacity={0.05}
          opacity={0.4}
          displace={0.4}
          className="w-full relative"
        >
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full h-full rounded-[32px] overflow-hidden relative z-10">
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
        </GlassSurface>
      </div>
    </section>
  );
};

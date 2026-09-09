import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-white/5 bg-[#050507] py-8 px-6">
      <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Copyright */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Image unoptimized src="/logo.png?v=2" alt="EDGE Protocol Logo" width={20} height={20} className="rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            <span className="font-bold text-sm tracking-tight">EDGE Protocol</span>
          </div>
          <span className="text-white/20">|</span>
          <p className="text-[12px] text-white/40">
            &copy; {new Date().getFullYear()} EDGE Protocol. All rights reserved.
          </p>
        </div>

        {/* Links & Socials */}
        <div className="flex items-center gap-6">
          <Link href="/markets" className="text-[12px] text-white/50 hover:text-white transition-colors">
            Markets
          </Link>
          <Link href="/docs" className="text-[12px] text-white/50 hover:text-white transition-colors">
            Documentation
          </Link>
          <a href="#" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors" aria-label="X (Twitter)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
          </a>
        </div>

      </div>
    </footer>
  );
};

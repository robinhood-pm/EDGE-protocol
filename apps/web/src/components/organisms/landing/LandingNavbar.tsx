import React from 'react';
import Link from 'next/link';

export const LandingNavbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#070709]/60 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] supports-[backdrop-filter]:bg-[#070709]/40">
      <div className="container max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-5 h-5 rounded-full border-[3px] border-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
          <span className="font-bold text-lg tracking-tight drop-shadow-md">EDGE Protocol</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[13px] font-medium text-white/70">
          <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
          <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
          </a>
          <Link href="/markets">
            <button className="px-5 py-2 text-[13px] font-medium rounded-full border border-white/20 hover:bg-white/10 transition-colors shadow-sm">
              Launch App
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

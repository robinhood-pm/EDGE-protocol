"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const GlobalLoadingOverlay = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Show overlay on every route change, refresh, or first visit
    setIsInitializing(true);
    
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isInitializing) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#070709] flex flex-col items-center justify-center overflow-hidden">
      {/* Hyperspeed Background Video */}
      <div className="absolute inset-0 w-full h-full opacity-100 pointer-events-none">
        <video 
          src="/hyperspeed.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Branding & Loading Indicator */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-white/90 shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse"></div>
          <span className="font-bold text-3xl tracking-tight drop-shadow-lg text-white">EDGE Protocol</span>
        </div>
        
        {/* Loading Dots */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#594EE6] animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#594EE6] animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#594EE6] animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <span className="text-white/40 text-xs mt-2 uppercase tracking-widest font-mono">Initializing System</span>
      </div>
    </div>
  );
};

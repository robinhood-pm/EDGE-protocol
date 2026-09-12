"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Globe } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NotificationPanel } from '@/components/organisms/social/NotificationPanel';

const NAV_ITEMS = [
  { href: '/callouts', label: 'Callouts', showPulse: true },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/markets', label: 'Markets' },
  { href: '/perps', label: 'Perps' },
  { href: '/portfolio', label: 'Portfolio' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070709]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] supports-[backdrop-filter]:bg-[#070709]/60">
      <div className="container flex h-16 items-center px-4 max-w-screen-2xl mx-auto gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <Image
              unoptimized
              src="/logo.png?v=2"
              alt="EDGE Protocol Logo"
              width={24}
              height={24}
              className="rounded-full bg-white ring-1 ring-white/80 shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-lg tracking-tight drop-shadow-md">EDGE Protocol</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium bg-white/5 p-1 rounded-full border border-white/10">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-[1.02]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.showPulse && (
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex-1 flex items-center justify-center max-w-md mx-auto hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input 
              type="text" 
              placeholder="Search markets or callouts..." 
              className="w-full bg-white/5 border border-white/10 text-white rounded-full h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/30 transition-all placeholder:text-white/40"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/60">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <NotificationPanel />
          <div className="hidden sm:flex items-center gap-2">
            <ConnectButton 
              showBalance={false} 
              chainStatus="icon" 
              accountStatus="address"
            />
          </div>
          <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full">
            <Globe className="h-5 w-5 text-muted" />
          </Button>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import Link from 'next/link';
import { Search, Grid, List, Globe } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 max-w-screen-2xl mx-auto gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tight">predict</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-foreground transition-colors hover:text-foreground/80">
              Markets
            </Link>
            <Link href="/points" className="text-muted transition-colors hover:text-foreground">
              <span className="text-yellow-500 font-bold">Points</span>
            </Link>
            <Link href="/invite" className="text-muted transition-colors hover:text-foreground">
              Invite
            </Link>
          </nav>
        </div>
        
        <div className="flex-1 flex items-center justify-center max-w-md mx-auto hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search markets..." 
              className="w-full bg-card border border-border rounded-full h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-yes/50 focus:ring-1 focus:ring-yes/50 transition-all placeholder:text-muted"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" className="text-foreground">Log In</Button>
            <Button className="bg-white text-black hover:bg-neutral-200 rounded-full px-6 font-semibold">Sign Up</Button>
          </div>
          <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full">
            <Globe className="h-5 w-5 text-muted" />
          </Button>
        </div>
      </div>
    </header>
  );
}

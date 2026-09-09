import React from 'react';
import { Grid, List } from 'lucide-react';

const CATEGORIES = [
  "Trending", "Live", "New", "Sports", "Politics", "Crypto", "Esports", "Finance", "Tech", "Economy", "Culture", "More"
];

export function CategoryTabs() {
  return (
    <div className="w-full border-b border-border bg-background">
      <div className="container max-w-screen-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat, idx) => (
            <button 
              key={cat}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
                idx === 0 
                  ? "text-foreground border-b-2 border-foreground" 
                  : "text-muted hover:text-foreground"
              }`}
            >
              {cat === "Live" ? (
                <div className="flex items-center gap-1.5">
                  {cat} <span className="text-no text-xs font-bold">23</span>
                </div>
              ) : (
                cat
              )}
            </button>
          ))}
        </div>
        
        <div className="hidden md:flex items-center gap-1 ml-4 border border-border rounded-md p-1 bg-card">
          <button className="p-1 rounded bg-background shadow-sm text-foreground">
            <Grid className="w-4 h-4" />
          </button>
          <button className="p-1 rounded text-muted hover:text-foreground">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

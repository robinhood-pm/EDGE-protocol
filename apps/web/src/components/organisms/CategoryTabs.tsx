import React from 'react';
import { Grid, List } from 'lucide-react';

const CATEGORIES = [
  "Trending", "Live", "New", "Sports", "Politics", "Crypto", "Esports", "Finance", "Tech", "Economy", "Culture", "More"
];

interface CategoryTabsProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  liveCount?: number;
}

export function CategoryTabs({ activeCategory, onCategoryChange, liveCount = 0 }: CategoryTabsProps) {
  return (
    <div className="w-full border-b border-white/10 bg-[#070709]/60 backdrop-blur-xl sticky top-16 z-40">
      <div className="container max-w-screen-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat}
              onClick={() => {
                if (onCategoryChange) {
                  onCategoryChange(cat);
                } else {
                  window.location.href = `/markets?category=${cat}`;
                }
              }}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat 
                  ? "text-white border-b-2 border-white" 
                  : "text-white/50 hover:text-white"
              }`}
            >
              {cat === "Live" ? (
                <div className="flex items-center gap-1.5">
                  {cat} {liveCount > 0 && <span className="text-no text-xs font-bold">{liveCount}</span>}
                </div>
              ) : (
                cat
              )}
            </button>
          ))}
        </div>
        
        <div className="hidden md:flex items-center gap-1 ml-4 border border-white/10 rounded-md p-1 bg-white/5">
          <button className="p-1 rounded bg-white/10 shadow-sm text-white">
            <Grid className="w-4 h-4" />
          </button>
          <button className="p-1 rounded text-white/50 hover:text-white">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

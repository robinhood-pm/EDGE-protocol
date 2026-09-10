import React, { useEffect, useState, useRef } from 'react';

interface Transaction {
  id: string;
  side: 'YES' | 'NO';
  text: string;
  x: number;
}

export function FloatingTransactions({ realTrades = [] }: { realTrades?: any[] }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const lastProcessedTradeId = useRef<string | null>(null);

  // Handle Real Trades
  useEffect(() => {
    if (realTrades.length > 0) {
      const latestTrade = realTrades[0]; // Assuming realTrades is sorted descending (newest first)
      if (latestTrade && latestTrade.id !== lastProcessedTradeId.current) {
        lastProcessedTradeId.current = latestTrade.id;
        
        // Spawn real trade animation
        const newTx: Transaction = {
          id: `real-${latestTrade.id}-${Date.now()}`,
          side: latestTrade.side,
          text: `+ ${Number(latestTrade.amount).toFixed(1)} ${latestTrade.side}`,
          x: Math.floor(Math.random() * 40),
        };

        setTransactions(prev => [...prev, newTx]);

        setTimeout(() => {
          setTransactions(prev => prev.filter(t => t.id !== newTx.id));
        }, 2500);
      }
    }
  }, [realTrades]);

  // Handle Mock/Static Trades
  useEffect(() => {
    let idCounter = 0;
    
    // Randomly generate a new floating transaction every 2-4 seconds
    const interval = setInterval(() => {
      // 30% chance to generate one to not overcrowd the real ones
      if (Math.random() > 0.7) {
        const isYes = Math.random() > 0.5;
        // Realistic sizes: 10 to 1000 shares
        const amount = Math.floor(Math.random() * 990) + 10; 
        const xOffset = Math.floor(Math.random() * 40);

        const newTx: Transaction = {
          id: `mock-${idCounter++}`,
          side: isYes ? 'YES' : 'NO',
          text: `+ ${amount} ${isYes ? 'YES' : 'NO'}`,
          x: xOffset,
        };

        setTransactions(prev => [...prev, newTx]);

        setTimeout(() => {
          setTransactions(prev => prev.filter(t => t.id !== newTx.id));
        }, 2500);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 w-40 h-32 pointer-events-none z-20 overflow-visible">
      {transactions.map(tx => (
        <div
          key={tx.id}
          className={`absolute bottom-0 text-sm font-bold opacity-0 animate-float-up whitespace-nowrap ${tx.side === 'YES' ? 'text-yes' : 'text-no'}`}
          style={{ 
            left: `${tx.x}px`,
            animation: 'floatUp 2.5s ease-out forwards',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {tx.text}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% {
            transform: translateY(20px) scale(0.8);
            opacity: 0;
          }
          15% {
            transform: translateY(0px) scale(1.1);
            opacity: 1;
          }
          85% {
            transform: translateY(-50px) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-70px) scale(0.9);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}

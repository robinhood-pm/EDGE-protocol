import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Note: Provide default dummy URL/anon key to avoid crashing if env isn't set up yet, 
// but in production it should come from NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export function usePerpMarket(marketId: string) {
    const [marketStats, setMarketStats] = useState<any>(null);
    const [priceHistory, setPriceHistory] = useState<{price: number, timestamp: string}[]>([]);
    const [orderbook, setOrderbook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });
    const [positions, setPositions] = useState<any[]>([]);

    useEffect(() => {
        if (!marketId) return;

        // Initial Data Fetch from REST API (for quick snapshot)
        const fetchMarketData = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const network = process.env.NEXT_PUBLIC_NETWORK;
            try {
                // Fetch market stats
                const statRes = await fetch(`${apiUrl}/api/perps/${marketId}?network=${network}`);
                const statData = await statRes.json();
                if (statData.success) {
                    setMarketStats(statData.market);
                    if (statData.market.priceHistory) {
                        setPriceHistory(statData.market.priceHistory);
                    }
                }

                // Fetch initial orderbook
                const obRes = await fetch(`${apiUrl}/api/perps/${marketId}/orderbook?network=${network}`);
                const obData = await obRes.json();
                if (obData.success) setOrderbook(obData.orderbook);

            } catch (err) {
                console.error("Failed to fetch perp market data:", err);
            }
        };

        fetchMarketData();

        // Subscriptions to Supabase for Realtime Updates
        const channel = supabase.channel(`perp_${marketId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'perp_orders', filter: `market_id=eq.${marketId}` },
                (payload) => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                    const network = process.env.NEXT_PUBLIC_NETWORK;
                    // Re-fetch orderbook or apply differential update
                    // For MVP simplicity, we re-fetch the orderbook snapshot on change
                    fetch(`${apiUrl}/api/perps/${marketId}/orderbook?network=${network}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) setOrderbook(data.orderbook);
                        });
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'perp_mark_prices', filter: `market_id=eq.${marketId}` },
                (payload) => {
                    setMarketStats((prev: any) => ({ ...prev, currentMarkPrice: payload.new.price }));
                    setPriceHistory((prev: any) => {
                        const newHistory = [...prev, { price: payload.new.price, timestamp: payload.new.timestamp }];
                        // Keep only the last 50 entries
                        if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
                        return newHistory;
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'perp_positions', filter: `market_id=eq.${marketId}` },
                (payload) => {
                    // When a position is created or updated, we just update the state
                    // If it's an INSERT, add it to the positions array.
                    // If it's an UPDATE, replace the existing one.
                    setPositions((prev) => {
                        const pos = payload.new as any;
                        const existingIdx = prev.findIndex((p) => p.id === pos.id);
                        if (existingIdx >= 0) {
                            const newPositions = [...prev];
                            newPositions[existingIdx] = pos;
                            return newPositions;
                        } else {
                            return [pos, ...prev];
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [marketId]);

    // Fetch user positions
    const fetchPositions = React.useCallback(async (traderAddress: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const network = process.env.NEXT_PUBLIC_NETWORK;
        try {
            const posRes = await fetch(`${apiUrl}/api/perps/positions?network=${network}&trader=${traderAddress}`);
            const posData = await posRes.json();
            if (posData.success) setPositions(posData.positions);
        } catch (err) {
            console.error("Failed to fetch positions:", err);
        }
    }, []);

    return {
        marketStats,
        priceHistory,
        orderbook,
        positions,
        fetchPositions
    };
}

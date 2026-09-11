import { supabase } from '../utils/supabase';

const TWAP_WINDOW_MS = 60 * 1000; // 60 seconds TWAP for Mark Price

// In-memory store for perp mid prices
// Structure: { [marketId]: { price: number; timestamp: number }[] }
const perpMidHistory: Record<string, { price: number; timestamp: number }[]> = {};

/**
 * Calculates the current Mid Price of the Perpetual Market Orderbook.
 * @param perpMarketId The ID of the perpetual market
 * @param network 'testnet' or 'mainnet'
 */
async function getPerpMidPrice(perpMarketId: string, network: string): Promise<number | null> {
    try {
        const { data: orders, error } = await supabase
            .from('perp_orders')
            .select('price, side')
            .eq('market_id', perpMarketId)
            .eq('network', network)
            .eq('status', 'OPEN');

        if (error) return null;

        let bestBid = 0;
        let bestAsk = 1;

        if (orders && orders.length > 0) {
            const buys = orders.filter(o => o.side === 'LONG').map(o => Number(o.price));
            const sells = orders.filter(o => o.side === 'SHORT').map(o => Number(o.price));

            if (buys.length > 0) bestBid = Math.max(...buys);
            if (sells.length > 0) bestAsk = Math.min(...sells);
        }

        if (bestBid > 0 && bestAsk < 1 && bestBid <= bestAsk) {
            return (bestBid + bestAsk) / 2;
        }

        // Fallback to last matched fill price
        const { data: lastFill, error: fillError } = await supabase
            .from('perp_fills')
            .select('price')
            .eq('market_id', perpMarketId)
            .eq('network', network)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (fillError || !lastFill) return null;

        return Number(lastFill.price);
    } catch (e) {
        return null;
    }
}

/**
 * Updates the Mark Price for a specific perp market.
 * Mark Price = clamp(Index Price + Premium_TWAP, 0, 1)
 */
export const updateMarkPrice = async (perpMarketId: string, network: string) => {
    try {
        // 1. Get latest Index Price
        const { data: indexRecord, error: idxErr } = await supabase
            .from('perp_index_prices')
            .select('price')
            .eq('market_id', perpMarketId)
            .eq('network', network)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (idxErr || !indexRecord) return; // Cannot calculate mark price without index

        const indexPrice = Number(indexRecord.price);

        // 2. Get current Perp Mid Price
        const perpMid = await getPerpMidPrice(perpMarketId, network);
        const now = Date.now();

        if (!perpMidHistory[perpMarketId]) {
            perpMidHistory[perpMarketId] = [];
        }

        // If there's a valid perp mid, add it to history. If not, use index price as a fallback for the premium calc (zero premium)
        const effectivePerpPrice = perpMid !== null ? perpMid : indexPrice;
        
        perpMidHistory[perpMarketId].push({ price: effectivePerpPrice, timestamp: now });

        // Remove old observations
        perpMidHistory[perpMarketId] = perpMidHistory[perpMarketId].filter(
            obs => now - obs.timestamp <= TWAP_WINDOW_MS
        );

        // 3. Calculate Perp TWAP
        const prices = perpMidHistory[perpMarketId].map(obs => obs.price);
        const perpTwap = prices.reduce((sum, p) => sum + p, 0) / prices.length;

        // 4. Premium TWAP = Perp TWAP - Index Price
        const premiumTwap = perpTwap - indexPrice;

        // 5. Final Mark Price = Index Price + Premium TWAP (clamped between 0 and 1)
        let markPrice = indexPrice + premiumTwap;
        markPrice = Math.max(0, Math.min(1, markPrice));

        // Save Mark Price
        await supabase.from('perp_mark_prices').insert({
            market_id: perpMarketId,
            network,
            price: markPrice
        });

        console.log(`[Mark Price Engine] ${perpMarketId} (${network}): Index = ${indexPrice.toFixed(4)}, Mark = ${markPrice.toFixed(4)} (Premium = ${premiumTwap.toFixed(4)})`);
    } catch (e) {
        console.error(`[Mark Price Engine] Error updating mark price for ${perpMarketId}:`, e);
    }
};

/**
 * Starts a polling loop to update the Mark Price for all active perp markets.
 */
export const startMarkPriceEngine = () => {
    console.log('[Mark Price Engine] Engine started.');
    
    // Poll every 10 seconds, slightly offset from Probability Index Engine
    setInterval(async () => {
        try {
            const { data: markets, error } = await supabase
                .from('perp_markets')
                .select('id, network')
                .in('status', ['ACTIVE', 'REDUCE_ONLY']);

            if (error || !markets) return;

            for (const market of markets) {
                await updateMarkPrice(market.id, market.network);
            }
        } catch (e) {
            console.error(`[Mark Price Engine] Main loop error:`, e);
        }
    }, 10000); // 10s loop
};

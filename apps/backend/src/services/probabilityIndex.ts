import { supabase } from '../utils/supabase';

// In-memory store for price history to calculate TWAP
// Structure: { [marketId]: { prices: { price: number, timestamp: number }[] } }
const priceHistory: Record<string, { price: number; timestamp: number }[]> = {};

const TWAP_WINDOW_MS = 60 * 1000; // 60 seconds TWAP

/**
 * Computes the mid price from the orderbook for a given prediction market.
 */
async function getMidPrice(predictionMarketId: string, network: string): Promise<number | null> {
    try {
        // Fetch pending YES orders to determine best bid and best ask
        const { data: orders, error } = await supabase
            .from('orders')
            .select('price, raw_order')
            .eq('market_id', predictionMarketId)
            .eq('network', network)
            .eq('side', 'YES')
            .eq('status', 'PENDING');

        if (error) {
            console.error(`[Probability Index] Error fetching orders for ${predictionMarketId}:`, error);
            return null;
        }

        let bestBid = 0;
        let bestAsk = 1;

        if (orders && orders.length > 0) {
            const buys = orders.filter(o => o.raw_order?.isBuy === true).map(o => Number(o.price));
            const sells = orders.filter(o => o.raw_order?.isBuy === false).map(o => Number(o.price));

            if (buys.length > 0) bestBid = Math.max(...buys);
            if (sells.length > 0) bestAsk = Math.min(...sells);
        }

        // If there's a valid bid/ask spread, use the mid price
        if (bestBid > 0 && bestAsk < 1 && bestBid <= bestAsk) {
            return (bestBid + bestAsk) / 2;
        }

        // Fallback: Last traded price from the market data
        const { data: market, error: marketError } = await supabase
            .from('markets')
            .select('current_yes_probability')
            .eq('id', predictionMarketId)
            .eq('network', network)
            .single();

        if (marketError || !market) {
            return null; // Cannot determine price
        }

        return Number(market.current_yes_probability) / 100;
    } catch (e) {
        console.error(`[Probability Index] getMidPrice exception:`, e);
        return null;
    }
}

/**
 * Calculates and updates the TWAP Index Price for a given perp market.
 */
export const updateProbabilityIndex = async (perpMarketId: string, predictionMarketId: string, network: string) => {
    const midPrice = await getMidPrice(predictionMarketId, network);
    if (midPrice === null) return;

    const now = Date.now();

    if (!priceHistory[perpMarketId]) {
        priceHistory[perpMarketId] = [];
    }

    // Add new price observation
    priceHistory[perpMarketId].push({ price: midPrice, timestamp: now });

    // Remove observations outside the TWAP window
    priceHistory[perpMarketId] = priceHistory[perpMarketId].filter(
        obs => now - obs.timestamp <= TWAP_WINDOW_MS
    );

    // Calculate TWAP (Time-Weighted Average Price) - simplified as simple moving average for discrete polling
    const prices = priceHistory[perpMarketId].map(obs => obs.price);
    const twap = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // Save to Database
    try {
        await supabase.from('perp_index_prices').insert({
            market_id: perpMarketId,
            network,
            price: twap
        });
        
        console.log(`[Probability Index] ${perpMarketId} (${network}): Mid = ${midPrice.toFixed(4)}, TWAP Index = ${twap.toFixed(4)}`);
    } catch (e) {
        console.error(`[Probability Index] Error saving index price for ${perpMarketId}:`, e);
    }
};

/**
 * Starts a polling loop to update the index price for all active perp markets.
 */
export const startProbabilityIndexEngine = () => {
    console.log('[Probability Index] Engine started.');
    
    // Poll every 10 seconds
    setInterval(async () => {
        try {
            // Fetch all active perp markets (assumes we check mainnet & testnet)
            const { data: markets, error } = await supabase
                .from('perp_markets')
                .select('id, prediction_market_id, network')
                .in('status', ['ACTIVE', 'REDUCE_ONLY']);

            if (error || !markets) return;

            for (const market of markets) {
                await updateProbabilityIndex(market.id, market.prediction_market_id, market.network);
            }
        } catch (e) {
            console.error(`[Probability Index] Main loop error:`, e);
        }
    }, 10000);
};

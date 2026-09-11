import { matchPerpOrdersAsync } from './perpsMatchingEngine';
import { supabase } from '../utils/supabase';

const NETWORK = 'testnet';
const INTERVAL_MS = 3000;

export const startMatchingEngineRunner = () => {
    console.log(`🚀 [Matching Engine Service] Started auto-matching loop.`);

    setInterval(async () => {
        try {
            const { data: activeMarkets, error } = await supabase.from('perp_markets').select('id');
            if (error || !activeMarkets || activeMarkets.length === 0) return;

            const markets = activeMarkets.map((m: any) => m.id);

            for (const marketId of markets) {
                await matchPerpOrdersAsync(marketId, NETWORK);
            }
        } catch (e) {
            console.error(`[Matching Engine Service] Loop error:`, e);
        }
    }, INTERVAL_MS);
};

import { matchPerpOrdersAsync } from '../src/services/perpsMatchingEngine';

import { supabase } from '../src/utils/supabase';

const NETWORK = 'testnet';
const INTERVAL_MS = 3000;

const runEngine = async () => {
    console.log(`🚀 Starting Auto-Fill Matching Engine for ALL markets...`);
    
    setInterval(async () => {
        // Fetch all active markets dynamically
        const { data: activeMarkets, error } = await supabase.from('perp_markets').select('id');
        if (error || !activeMarkets || activeMarkets.length === 0) {
            console.error('❌ Failed to fetch markets from DB or no markets exist.', error);
            return;
        }

        const markets = activeMarkets.map((m: any) => m.id);
        
        for (const marketId of markets) {
            await matchPerpOrdersAsync(marketId, NETWORK);
        }
    }, INTERVAL_MS);
};

runEngine().catch(console.error);

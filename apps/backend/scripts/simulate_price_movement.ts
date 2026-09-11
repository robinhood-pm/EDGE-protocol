import { supabase } from '../src/utils/supabase';
import * as dotenv from 'dotenv';
dotenv.config();

const NETWORK = 'testnet';
const VOLATILITY = 0.05; // Max 0.05 probability shift per tick
const INTERVAL_MS = 2500; // 2.5 seconds

const runSimulation = async () => {
    console.log(`🚀 Starting Global Probability Price Simulator...`);

    // 1. Fetch all active markets
    const { data: markets, error } = await supabase.from('perp_markets').select('id');
    if (error || !markets || markets.length === 0) {
        console.error('❌ Failed to fetch markets from DB or no markets exist.', error);
        return;
    }

    const marketIds = markets.map((m: any) => m.id);
    console.log(`📈 Tracking ${marketIds.length} markets...`);

    // 2. Initialize current prices by fetching the latest price for each
    const currentPrices: Record<string, number> = {};
    for (const mId of marketIds) {
        const { data: lastPrice } = await supabase
            .from('perp_index_prices')
            .select('price')
            .eq('market_id', mId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        const isCrypto = mId.includes('USD') || mId.includes('USDG');
        const defaultPrice = isCrypto ? (mId.includes('BTC') ? 64000 : 3500) : 0.50;
        
        currentPrices[mId] = lastPrice ? Number(lastPrice.price) : defaultPrice; // default depending on market
        
        // Fix currently messed up prices for Crypto
        if (isCrypto && currentPrices[mId] < 10) {
            currentPrices[mId] = defaultPrice;
        }
    }

    // 3. Loop and update all markets simultaneously
    setInterval(async () => {
        const inserts = [];

        for (const mId of marketIds) {
            const isCrypto = mId.includes('USD') || mId.includes('USDG');
            
            // Adjust volatility and clamping based on market type
            let newPrice = currentPrices[mId];
            if (isCrypto) {
                // Crypto: higher volatility (e.g. 0.5% per tick)
                const cryptoVol = currentPrices[mId] * 0.005; 
                const change = (Math.random() * cryptoVol * 2) - cryptoVol;
                newPrice += change;
                // No strict upper bound, lower bound > 0
                if (newPrice < 1) newPrice = 1;
            } else {
                // Probability: max 0.05 shift, clamped 0.01 to 0.99
                const change = (Math.random() * VOLATILITY * 2) - VOLATILITY;
                newPrice += change;
                if (newPrice > 0.99) newPrice = 0.99;
                if (newPrice < 0.01) newPrice = 0.01;
            }

            currentPrices[mId] = newPrice;

            inserts.push({
                market_id: mId,
                network: NETWORK,
                price: newPrice
            });
            console.log(`📈 [Simulator] New Index Price for ${mId}: $${newPrice.toFixed(4)}`);
        }

        // Insert new Index Prices
        const { error: insErr } = await supabase.from('perp_index_prices').insert(inserts);

        if (insErr) {
            console.error('❌ Failed to insert prices:', insErr.message);
        }
    }, INTERVAL_MS);
};

runSimulation().catch(console.error);

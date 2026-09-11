import { supabase } from '../src/utils/supabase';
import * as dotenv from 'dotenv';
dotenv.config();

const MARKET_ID = 'PERP-BTC-USDG';
const NETWORK = 'testnet';
const VOLATILITY = 15; // Max $15 movement per tick
const INTERVAL_MS = 2500; // 2.5 seconds

const runSimulation = async () => {
    console.log(`🚀 Starting Price Simulator for ${MARKET_ID}...`);

    let currentPrice = 65000.50; // Initial price

    // Get the latest price if it exists
    const { data: lastPrice } = await supabase
        .from('perp_index_prices')
        .select('price')
        .eq('market_id', MARKET_ID)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

    if (lastPrice) {
        currentPrice = Number(lastPrice.price);
    }

    setInterval(async () => {
        // Random walk
        const change = (Math.random() * VOLATILITY * 2) - VOLATILITY;
        currentPrice = currentPrice + change;

        // Insert new Index Price
        const { error } = await supabase.from('perp_index_prices').insert({
            market_id: MARKET_ID,
            network: NETWORK,
            price: currentPrice
        });

        if (error) {
            console.error('❌ Failed to insert price:', error.message);
        } else {
            console.log(`📈 [Simulator] New Index Price for ${MARKET_ID}: $${currentPrice.toFixed(2)}`);
        }
    }, INTERVAL_MS);
};

runSimulation().catch(console.error);

import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import { getStaticProvider } from '../utils/provider';
import * as dotenv from 'dotenv';

dotenv.config();

const FUNDING_MODULE_ABI = [
    "function applyFunding(uint256 perpMarketId, int256 fundingRate) external"
];

// Constants for funding rate calculation
const FUNDING_MULTIPLIER = 1.0; // "k" factor
const MAX_FUNDING_RATE = 0.05; // 5% max funding rate per interval

/**
 * Calculates and applies the funding rate for a specific perp market.
 * Premium = Mark Price - Index Price
 * Funding Rate = clamp(Premium * k, -Max, +Max)
 */
export const executeFundingCycle = async (perpMarketId: string, network: string) => {
    try {
        console.log(`[Funding Engine] Executing cycle for market ${perpMarketId} on ${network}`);

        // 1. Fetch latest Mark Price
        const { data: markRecord, error: markErr } = await supabase
            .from('perp_mark_prices')
            .select('price')
            .eq('market_id', perpMarketId)
            .eq('network', network)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        // 2. Fetch latest Index Price
        const { data: indexRecord, error: idxErr } = await supabase
            .from('perp_index_prices')
            .select('price')
            .eq('market_id', perpMarketId)
            .eq('network', network)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (markErr || idxErr || !markRecord || !indexRecord) {
            console.warn(`[Funding Engine] Missing price data for ${perpMarketId}. Skipping funding.`);
            return;
        }

        const markPrice = Number(markRecord.price);
        const indexPrice = Number(indexRecord.price);

        // 3. Calculate Premium and Funding Rate
        const premium = markPrice - indexPrice;
        let fundingRate = premium * FUNDING_MULTIPLIER;
        
        // Clamp funding rate
        fundingRate = Math.max(-MAX_FUNDING_RATE, Math.min(MAX_FUNDING_RATE, fundingRate));

        console.log(`[Funding Engine] ${perpMarketId}: Mark=${markPrice.toFixed(4)}, Index=${indexPrice.toFixed(4)}, Rate=${(fundingRate * 100).toFixed(2)}%`);

        // 4. Submit to blockchain via Relayer
        if (process.env.RELAYER_PRIVATE_KEY && process.env.FUNDING_MODULE_ADDRESS) {
            try {
                const provider = getStaticProvider();
                const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
                const fundingModule = new ethers.Contract(process.env.FUNDING_MODULE_ADDRESS, FUNDING_MODULE_ABI, relayer);

                // Convert fundingRate to 18 decimals int256
                const fundingRateWei = ethers.parseUnits(fundingRate.toFixed(18), 18);
                
                console.log(`[Funding Engine] Relaying applyFunding tx...`);
                const tx = await fundingModule.applyFunding(perpMarketId, fundingRateWei);
                await tx.wait();
                console.log(`[Funding Engine] Tx successful: ${tx.hash}`);

            } catch (onchainErr) {
                console.error(`[Funding Engine] On-chain tx failed:`, onchainErr);
                // We might still want to record it off-chain even if on-chain reverts (e.g. out of gas) 
                // but usually we'd retry. For this MVP, we proceed to record off-chain.
            }
        } else {
            console.warn(`[Funding Engine] Missing relayer or funding module address. Skipping on-chain tx.`);
        }

        // 5. Save to Database History
        await supabase.from('perp_funding_rates').insert({
            network,
            market_id: perpMarketId,
            rate: fundingRate,
            mark_price: markPrice,
            index_price: indexPrice
        });

    } catch (e) {
        console.error(`[Funding Engine] Error executing cycle for ${perpMarketId}:`, e);
    }
};

/**
 * Starts the cron job for the Funding Engine.
 * Usually runs every 1 hour or 8 hours depending on the protocol design.
 * For testnet, we might run it every 10 minutes to see it in action.
 */
export const startFundingEngine = () => {
    console.log('[Funding Engine] Engine started.');
    
    // Testnet interval: Every 10 minutes (600,000 ms)
    setInterval(async () => {
        try {
            const { data: markets, error } = await supabase
                .from('perp_markets')
                .select('id, network')
                .in('status', ['ACTIVE', 'REDUCE_ONLY']);

            if (error || !markets) return;

            for (const market of markets) {
                await executeFundingCycle(market.id, market.network);
            }
        } catch (e) {
            console.error(`[Funding Engine] Main loop error:`, e);
        }
    }, 600000); 
};

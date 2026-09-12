import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import { getStaticProvider, safeAddress } from '../utils/provider';
import * as dotenv from 'dotenv';

dotenv.config();

const PERP_SETTLEMENT_ABI = [
    "function settleMarket(uint256 perpMarketId, uint256 finalPrice) external"
];

/**
 * Checks for newly resolved prediction markets and triggers settlement for their linked perp markets.
 */
export const runPerpSettlementCheck = async () => {
    try {
        // Find all Perp Markets that are ACTIVE or REDUCE_ONLY, but their underlying Prediction Market is RESOLVED
        const { data: perpMarkets, error: pmErr } = await supabase
            .from('perp_markets')
            .select('id, prediction_market_id, network')
            .in('status', ['ACTIVE', 'REDUCE_ONLY', 'PAUSED']);

        if (pmErr || !perpMarkets) return;

        for (const perpMarket of perpMarkets) {
            // Check the status of the underlying prediction market
            const { data: predictionMarket, error: predErr } = await supabase
                .from('markets')
                .select('status, outcome')
                .eq('id', perpMarket.prediction_market_id)
                .eq('network', perpMarket.network)
                .single();

            if (predErr || !predictionMarket) continue;

            if (predictionMarket.status === 'RESOLVED') {
                console.log(`[Perp Settlement] Prediction Market ${perpMarket.prediction_market_id} is RESOLVED. Triggering perp settlement...`);
                
                // Determine final settlement price based on outcome
                // YES (Outcome 1) -> 1.00
                // NO (Outcome 0) -> 0.00
                // INVALID (Outcome 2) -> 0.50
                let finalPrice = 0;
                if (predictionMarket.outcome === 1 || predictionMarket.outcome === 'YES') {
                    finalPrice = 1.00;
                } else if (predictionMarket.outcome === 0 || predictionMarket.outcome === 'NO') {
                    finalPrice = 0.00;
                } else if (predictionMarket.outcome === 2 || predictionMarket.outcome === 'INVALID') {
                    finalPrice = 0.50;
                } else {
                    console.warn(`[Perp Settlement] Unknown outcome ${predictionMarket.outcome} for market ${perpMarket.prediction_market_id}`);
                    continue;
                }

                console.log(`[Perp Settlement] Final Settlement Price for ${perpMarket.id} is ${finalPrice.toFixed(2)}`);

                if (process.env.RELAYER_PRIVATE_KEY && process.env.PERP_SETTLEMENT_ADDRESS) {
                    try {
                        const provider = getStaticProvider();
                        const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
                        const settlementContract = new ethers.Contract(safeAddress(process.env.PERP_SETTLEMENT_ADDRESS), PERP_SETTLEMENT_ABI, relayer);

                        const finalPriceWei = ethers.parseUnits(finalPrice.toFixed(18), 18);
                        
                        console.log(`[Perp Settlement] Relaying settleMarket tx...`);
                        const tx = await settlementContract.settleMarket(perpMarket.id, finalPriceWei);
                        const receipt = await tx.wait();
                        
                        console.log(`[Perp Settlement] On-chain settlement successful: ${receipt.hash}`);

                        // Update local DB status
                        await supabase.from('perp_markets').update({ status: 'SETTLED' }).eq('id', perpMarket.id);
                        
                        // Close all open positions (in UI/DB, though technically the smart contract already settled them)
                        await supabase.from('perp_positions').update({ status: 'CLOSED' }).eq('market_id', perpMarket.id).eq('status', 'OPEN');
                        
                        // Cancel all pending orders
                        await supabase.from('perp_orders').update({ status: 'CANCELED' }).eq('market_id', perpMarket.id).eq('status', 'OPEN');
                        
                    } catch (onchainErr) {
                        console.error(`[Perp Settlement] On-chain settlement failed:`, onchainErr);
                    }
                } else {
                    console.warn(`[Perp Settlement] Missing relayer credentials. Could not settle on-chain.`);
                    
                    // Offchain fallback for UI presentation
                    await supabase.from('perp_markets').update({ status: 'SETTLED' }).eq('id', perpMarket.id);
                    await supabase.from('perp_positions').update({ status: 'CLOSED' }).eq('market_id', perpMarket.id).eq('status', 'OPEN');
                    await supabase.from('perp_orders').update({ status: 'CANCELED' }).eq('market_id', perpMarket.id).eq('status', 'OPEN');
                }
            }
        }
    } catch (e) {
        console.error(`[Perp Settlement] Main loop error:`, e);
    }
};

/**
 * Starts the settlement polling monitor.
 * Runs less frequently than liquidation, e.g., every 30 seconds.
 */
export const startPerpSettlementMonitor = () => {
    console.log('[Perp Settlement] Engine started.');
    
    setInterval(() => {
        runPerpSettlementCheck();
    }, 30000); 
};

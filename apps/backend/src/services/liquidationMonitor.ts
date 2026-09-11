import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import { calculatePositionEquity, calculateMaintenanceMargin } from './marginEngine';
import * as dotenv from 'dotenv';

dotenv.config();

const LIQUIDATION_ENGINE_ABI = [
    "function liquidatePosition(uint256 perpMarketId, address trader) external"
];

/**
 * Checks all active positions and triggers liquidations if Equity falls below Maintenance Margin.
 */
export const runLiquidationCheck = async () => {
    try {
        // Fetch all open positions across all networks
        const { data: positions, error: posErr } = await supabase
            .from('perp_positions')
            .select('*')
            .eq('status', 'OPEN');

        if (posErr || !positions) return;

        // Group by market for efficient price and MMR fetching
        const marketsToFetch = [...new Set(positions.map(p => p.market_id))];

        for (const marketId of marketsToFetch) {
            // Optimally, fetch the mark price once per market
            const { data: markRecord } = await supabase
                .from('perp_mark_prices')
                .select('price, network')
                .eq('market_id', marketId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            const { data: marketParams } = await supabase
                .from('perp_markets')
                .select('maintenance_margin_rate')
                .eq('id', marketId)
                .single();

            if (!markRecord || !marketParams) continue;

            const markPrice = Number(markRecord.price);
            const mmrRate = Number(marketParams.maintenance_margin_rate);
            const network = markRecord.network;

            const marketPositions = positions.filter(p => p.market_id === marketId);

            for (const pos of marketPositions) {
                const { equity } = calculatePositionEquity(
                    pos.side as 'LONG' | 'SHORT',
                    Number(pos.size),
                    Number(pos.entry_price),
                    markPrice,
                    Number(pos.margin),
                    Number(pos.funding_accrued)
                );

                const mmr = calculateMaintenanceMargin(Number(pos.size), markPrice, mmrRate);

                if (equity < mmr) {
                    console.log(`[Liquidation Monitor] 🔥 LIQUIDATION TRIGGERED: Trader ${pos.trader} on Market ${marketId}. Equity: ${equity.toFixed(4)} < MMR: ${mmr.toFixed(4)}`);

                    // Send Liquidation Transaction to Chain
                    if (process.env.RELAYER_PRIVATE_KEY && process.env.LIQUIDATION_ENGINE_ADDRESS) {
                        try {
                            const provider = new ethers.JsonRpcProvider(process.env.ROBINHOOD_RPC_URL || process.env.RPC_URL);
                            const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
                            const liquidationEngine = new ethers.Contract(process.env.LIQUIDATION_ENGINE_ADDRESS, LIQUIDATION_ENGINE_ABI, relayer);

                            const tx = await liquidationEngine.liquidatePosition(marketId, pos.trader);
                            const receipt = await tx.wait();
                            console.log(`[Liquidation Monitor] ⛓️ On-chain liquidation successful: ${receipt.hash}`);

                            // Update Database
                            await supabase.from('perp_positions').update({ status: 'LIQUIDATED' }).eq('id', pos.id);
                            
                            // Insert Liquidation Record
                            await supabase.from('perp_liquidations').insert({
                                network,
                                trader: pos.trader,
                                market_id: marketId,
                                position_id: pos.id,
                                mark_price: markPrice,
                                penalty_amount: 0 // In reality, we'd pull the actual penalty from the on-chain event via indexer
                            });

                        } catch (onchainErr) {
                            console.error(`[Liquidation Monitor] On-chain liquidation failed for ${pos.trader}:`, onchainErr);
                        }
                    } else {
                        console.warn(`[Liquidation Monitor] Missing relayer credentials. Could not liquidate ${pos.trader} on-chain.`);
                        // Off-chain dummy liquidation
                        await supabase.from('perp_positions').update({ status: 'LIQUIDATED' }).eq('id', pos.id);
                    }
                }
            }
        }
    } catch (e) {
        console.error(`[Liquidation Monitor] Main loop error:`, e);
    }
};

/**
 * Starts the continuous liquidation monitoring loop.
 */
export const startLiquidationMonitor = () => {
    console.log('[Liquidation Monitor] Engine started.');
    
    // Check every 5 seconds for liquidations (high frequency)
    setInterval(() => {
        runLiquidationCheck();
    }, 5000);
};

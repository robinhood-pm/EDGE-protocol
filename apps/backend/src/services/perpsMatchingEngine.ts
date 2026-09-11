import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import { validateOrderMargin } from './marginEngine';
import * as dotenv from 'dotenv';

dotenv.config();

const PERP_EXCHANGE_ABI = [
    "function matchPerpOrders(tuple(address maker, uint256 marketId, bool isLong, uint256 size, uint256 price, uint256 margin, uint256 leverage, uint256 nonce, uint256 expiration) longOrder, bytes longSignature, tuple(address maker, uint256 marketId, bool isLong, uint256 size, uint256 price, uint256 margin, uint256 leverage, uint256 nonce, uint256 expiration) shortOrder, bytes shortSignature) external"
];

/**
 * Runs the matching engine for a specific perpetual market.
 */
export const matchPerpOrdersAsync = async (perpMarketId: string, network: string) => {
    try {
        console.log(`[Perp Matching Engine] Running for market ${perpMarketId} on ${network}`);
        
        // Fetch pending perp orders
        const { data: orders, error } = await supabase
            .from('perp_orders')
            .select('*')
            .eq('market_id', perpMarketId)
            .eq('network', network)
            .eq('status', 'OPEN');

        if (error || !orders) throw error;

        // Separate LONG and SHORT orders
        const longs = orders.filter(o => o.side === 'LONG').sort((a, b) => Number(b.price) - Number(a.price)); // Highest price first
        const shorts = orders.filter(o => o.side === 'SHORT').sort((a, b) => Number(a.price) - Number(b.price)); // Lowest price first

        for (const long of longs) {
            for (const short of shorts) {
                if (long.status === 'OPEN' && short.status === 'OPEN') {
                    // Check if prices cross (Long is willing to pay >= Short's asking price)
                    if (Number(long.price) >= Number(short.price)) {
                        console.log(`[Perp Matching Engine] Found match! Long: ${long.id} (${long.price}) Short: ${short.id} (${short.price})`);
                        
                        // Validate Margin constraints off-chain before submitting tx
                        const longValid = await validateOrderMargin(perpMarketId, network, long.trader, Number(long.size), Number(long.price), Number(long.margin), Number(long.leverage));
                        const shortValid = await validateOrderMargin(perpMarketId, network, short.trader, Number(short.size), Number(short.price), Number(short.margin), Number(short.leverage));

                        if (!longValid.valid) {
                            console.log(`[Perp Matching Engine] Long order invalid: ${longValid.reason}`);
                            await supabase.from('perp_orders').update({ status: 'CANCELED' }).eq('id', long.id);
                            long.status = 'CANCELED';
                            continue;
                        }

                        if (!shortValid.valid) {
                            console.log(`[Perp Matching Engine] Short order invalid: ${shortValid.reason}`);
                            await supabase.from('perp_orders').update({ status: 'CANCELED' }).eq('id', short.id);
                            short.status = 'CANCELED';
                            continue;
                        }

                        try {
                            const provider = new ethers.JsonRpcProvider(process.env.ROBINHOOD_RPC_URL || process.env.RPC_URL);
                            const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001', provider);
                            const exchange = new ethers.Contract(process.env.PERP_EXCHANGE_ADDRESS || '0x', PERP_EXCHANGE_ABI, relayer);

                            // Construct order tuples
                            const longOrderTuple = {
                                maker: long.trader,
                                marketId: perpMarketId,
                                isLong: true,
                                size: ethers.parseUnits(long.size.toString(), 18),
                                price: ethers.parseUnits(long.price.toString(), 18),
                                margin: ethers.parseUnits(long.margin.toString(), 18),
                                leverage: ethers.parseUnits(long.leverage.toString(), 18),
                                nonce: long.nonce,
                                expiration: Math.floor(new Date(long.expiration).getTime() / 1000)
                            };

                            const shortOrderTuple = {
                                maker: short.trader,
                                marketId: perpMarketId,
                                isLong: false,
                                size: ethers.parseUnits(short.size.toString(), 18),
                                price: ethers.parseUnits(short.price.toString(), 18),
                                margin: ethers.parseUnits(short.margin.toString(), 18),
                                leverage: ethers.parseUnits(short.leverage.toString(), 18),
                                nonce: short.nonce,
                                expiration: Math.floor(new Date(short.expiration).getTime() / 1000)
                            };

                            if (process.env.RELAYER_PRIVATE_KEY && process.env.PERP_EXCHANGE_ADDRESS) {
                                console.log(`[Perp Matching Engine] Relaying match to contract ${process.env.PERP_EXCHANGE_ADDRESS}...`);
                                const tx = await exchange.matchPerpOrders(
                                    longOrderTuple,
                                    long.signature,
                                    shortOrderTuple,
                                    short.signature
                                );
                                const receipt = await tx.wait();
                                console.log(`[Perp Matching Engine] On-chain match successful: ${receipt.hash}`);

                                const tradePrice = Number(long.price); 
                                const tradeAmount = Math.min(Number(long.size), Number(short.size));

                                // Mark orders as filled
                                // For simplicity we assume full fill here, partial fill requires updating filled_amount
                                await supabase.from('perp_orders').update({ status: 'FILLED', filled_amount: tradeAmount }).eq('id', long.id);
                                await supabase.from('perp_orders').update({ status: 'FILLED', filled_amount: tradeAmount }).eq('id', short.id);

                                // Insert fill
                                await supabase.from('perp_fills').insert({
                                    network,
                                    match_id: receipt.hash,
                                    maker_order_id: long.id,
                                    taker_order_id: short.id,
                                    market_id: perpMarketId,
                                    size: tradeAmount,
                                    price: tradePrice
                                });

                                // Note: perp_positions table would theoretically be updated by the on-chain indexer,
                                // but if we want instant UI updates, we can optimistically insert/update it here as well.
                                // For production architecture, relying on the Indexer (listening to PositionOpened/Increased events) is safer.

                            } else {
                                console.warn(`[Perp Matching Engine] Cannot settle trade on-chain: Missing RELAYER_PRIVATE_KEY or PERP_EXCHANGE_ADDRESS`);
                            }

                            long.status = 'FILLED';
                            short.status = 'FILLED';
                        } catch (e) {
                            console.error(`[Perp Matching Engine] On-chain settlement failed:`, e);
                            // If it fails on-chain, we don't mark as FILLED because it didn't execute.
                            // Depending on the error, we might want to CANCELED it or keep it OPEN.
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error(`[Perp Matching Engine] Error:`, e);
    }
};

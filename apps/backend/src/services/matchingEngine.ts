import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const EXCHANGE_ABI = [
    "function matchOrders(tuple(address maker, uint256 marketId, uint8 outcome, uint256 amount, uint256 price, bool isBuy, uint256 nonce, uint256 expiration) buyOrder, bytes buySignature, tuple(address maker, uint256 marketId, uint8 outcome, uint256 amount, uint256 price, bool isBuy, uint256 nonce, uint256 expiration) sellOrder, bytes sellSignature) external"
];

export const matchOrdersAsync = async (marketId: string, network: string) => {
    try {
        console.log(`[Matching Engine] Running for market ${marketId}`);
        
        // Fetch pending orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .eq('network', network)
            .eq('status', 'PENDING');

        if (error || !orders) throw error;

        // Separate Buy and Sell orders for YES (In our UI, side YES means isBuy=true)
        const buyOrders = orders.filter(o => o.side === 'YES');
        const sellOrders = orders.filter(o => o.side === 'NO'); // In a real CLOB, NO is mapped to SELL YES.

        // Simple matching logic MVP: just find any two orders that cross
        for (const buy of buyOrders) {
            for (const sell of sellOrders) {
                // If prices overlap (buyer willing to pay >= seller asking)
                // Note: For MVP we just assume any YES vs NO order is a match if they add up to 100% or we just blindly match them for testing
                // In reality, 1 - NO_PRICE = YES_PRICE
                if (buy.status === 'PENDING' && sell.status === 'PENDING') {
                    console.log(`[Matching Engine] Found match! Buy: ${buy.id} Sell: ${sell.id}`);
                    
                    try {
                        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
                        const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001', provider);
                        const exchange = new ethers.Contract(process.env.EXCHANGE_ADDRESS || '0x', EXCHANGE_ABI, relayer);

                        // If we have full raw orders, execute on-chain
                        if (buy.raw_order && sell.raw_order && process.env.RELAYER_PRIVATE_KEY) {
                            // In this MVP, we map "NO" to isBuy=false (SELL YES) for the contract
                            const sellRaw = { ...sell.raw_order, isBuy: false }; 

                            const tx = await exchange.matchOrders(
                                buy.raw_order,
                                buy.signature,
                                sellRaw,
                                sell.signature
                            );
                            const receipt = await tx.wait();
                            console.log(`[Matching Engine] On-chain match successful: ${receipt.hash}`);

                            // Update DB
                            await supabase.from('orders').update({ status: 'FILLED', transaction_hash: receipt.hash }).eq('id', buy.id);
                            await supabase.from('orders').update({ status: 'FILLED', transaction_hash: receipt.hash }).eq('id', sell.id);
                        } else {
                            // Mock off-chain settlement for MVP if no relayer key
                            console.log(`[Matching Engine] Mock settlement (No Relayer Key)`);
                            await supabase.from('orders').update({ status: 'FILLED' }).eq('id', buy.id);
                            await supabase.from('orders').update({ status: 'FILLED' }).eq('id', sell.id);
                        }

                        // Mark as filled locally to avoid double matching in this loop
                        buy.status = 'FILLED';
                        sell.status = 'FILLED';
                    } catch (e) {
                        console.error(`[Matching Engine] Match failed on-chain:`, e);
                    }
                }
            }
        }
    } catch (e) {
        console.error(`[Matching Engine] Error:`, e);
    }
};

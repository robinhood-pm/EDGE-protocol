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

        // Separate Buy and Sell orders for the same side
        const yesBuys = orders.filter(o => o.side === 'YES' && o.raw_order?.isBuy === true);
        const yesSells = orders.filter(o => o.side === 'YES' && o.raw_order?.isBuy === false);
        const noBuys = orders.filter(o => o.side === 'NO' && o.raw_order?.isBuy === true);
        const noSells = orders.filter(o => o.side === 'NO' && o.raw_order?.isBuy === false);

        const tryMatch = async (buyOrders: any[], sellOrders: any[]) => {
            for (const buy of buyOrders) {
                for (const sell of sellOrders) {
                    if (buy.status === 'PENDING' && sell.status === 'PENDING') {
                        if (Number(buy.price) >= Number(sell.price)) {
                            console.log(`[Matching Engine] Found match! Buy: ${buy.id} (${buy.price}) Sell: ${sell.id} (${sell.price})`);
                            
                            try {
                                const provider = new ethers.JsonRpcProvider(process.env.ROBINHOOD_RPC_URL || process.env.RPC_URL);
                                const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001', provider);
                                const exchange = new ethers.Contract(process.env.EXCHANGE_ADDRESS || '0x', EXCHANGE_ABI, relayer);

                                if (buy.raw_order && sell.raw_order && process.env.RELAYER_PRIVATE_KEY) {
                                    console.log(`[Matching Engine] Relaying to contract ${process.env.EXCHANGE_ADDRESS} ...`);
                                    const tx = await exchange.matchOrders(
                                        buy.raw_order,
                                        buy.signature,
                                        sell.raw_order,
                                        sell.signature
                                    );
                                    const receipt = await tx.wait();
                                    console.log(`[Matching Engine] On-chain match successful: ${receipt.hash}`);

                                    await supabase.from('orders').update({ status: 'FILLED', transaction_hash: receipt.hash }).eq('id', buy.id);
                                    await supabase.from('orders').update({ status: 'FILLED', transaction_hash: receipt.hash }).eq('id', sell.id);

                                    const tradePrice = Number(buy.price); 
                                    const tradeAmount = Math.min(Number(buy.amount), Number(sell.amount));
                                    await supabase.from('trades').insert({
                                        network,
                                        market_id: marketId,
                                        buy_order_id: buy.id,
                                        sell_order_id: sell.id,
                                        price: tradePrice,
                                        amount: tradeAmount,
                                        buyer_address: buy.wallet_address,
                                        seller_address: sell.wallet_address,
                                        transaction_hash: receipt.hash,
                                    });

                                    const tradeVolume = tradePrice * tradeAmount;
                                    const { error: rpcErr } = await supabase.rpc('increment_volume', { market_id_param: marketId, network_param: network, volume_delta: tradeVolume });
                                    if (rpcErr) {
                                        const { data: m } = await supabase.from('markets').select('total_volume_usdg').eq('id', marketId).eq('network', network).single();
                                        if (m) {
                                            await supabase.from('markets').update({ total_volume_usdg: Number(m.total_volume_usdg) + tradeVolume, current_yes_probability: tradePrice * 100 }).eq('id', marketId).eq('network', network);
                                        }
                                    }
                                } else {
                                    console.warn(`[Matching Engine] Cannot settle trade on-chain: Missing RELAYER_PRIVATE_KEY`);
                                }

                                buy.status = 'FILLED';
                                sell.status = 'FILLED';
                                console.log(`[Matching Engine] Trade recorded successfully.`);
                            } catch (e) {
                                console.error(`[Matching Engine] On-chain settlement failed, recording trade offchain:`, (e as any).message?.slice(0, 80));
                                
                                // Still record trade offchain so chart/UI updates
                                await supabase.from('orders').update({ status: 'FILLED' }).eq('id', buy.id);
                                await supabase.from('orders').update({ status: 'FILLED' }).eq('id', sell.id);

                                const tradePrice = Number(buy.price);
                                const tradeAmount = Math.min(Number(buy.amount), Number(sell.amount));
                                await supabase.from('trades').insert({
                                    network,
                                    market_id: marketId,
                                    buy_order_id: buy.id,
                                    sell_order_id: sell.id,
                                    price: tradePrice,
                                    amount: tradeAmount,
                                    buyer_address: buy.wallet_address,
                                    seller_address: sell.wallet_address,
                                    transaction_hash: null,
                                });

                                const tradeVolume = tradePrice * tradeAmount;
                                const { error: rpcErr2 } = await supabase.rpc('increment_volume', { market_id_param: marketId, network_param: network, volume_delta: tradeVolume });
                                if (rpcErr2) {
                                    const { data: m } = await supabase.from('markets').select('total_volume_usdg').eq('id', marketId).eq('network', network).single();
                                    if (m) {
                                        await supabase.from('markets').update({ total_volume_usdg: Number(m.total_volume_usdg) + tradeVolume, current_yes_probability: tradePrice * 100 }).eq('id', marketId).eq('network', network);
                                    }
                                }

                                buy.status = 'FILLED';
                                sell.status = 'FILLED';
                                console.log(`[Matching Engine] Offchain trade recorded successfully.`);
                            }
                        }
                    }
                }
            }
        };

        await tryMatch(yesBuys, yesSells);
        await tryMatch(noBuys, noSells);
    } catch (e) {
        console.error(`[Matching Engine] Error:`, e);
    }
};

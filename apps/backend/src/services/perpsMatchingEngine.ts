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

        if (error || !orders || orders.length === 0) return;

        console.log(`[Perp Matching Engine] Found ${orders.length} OPEN orders to process.`);

        const provider = new ethers.JsonRpcProvider(process.env.ROBINHOOD_RPC_URL!);
        const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider);
        const exchange = new ethers.Contract(process.env.PERP_EXCHANGE_ADDRESS!, PERP_EXCHANGE_ABI, relayer);

        const DOMAIN = {
            name: 'EdgeProtocolPerpExchange',
            version: '1',
            chainId: Number(process.env.ROBINHOOD_CHAIN_ID!),
            verifyingContract: process.env.PERP_EXCHANGE_ADDRESS!
        };

        const TYPES = {
            PerpOrder: [
                { name: 'maker', type: 'address' },
                { name: 'marketId', type: 'uint256' },
                { name: 'isLong', type: 'bool' },
                { name: 'size', type: 'uint256' },
                { name: 'price', type: 'uint256' },
                { name: 'margin', type: 'uint256' },
                { name: 'leverage', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'expiration', type: 'uint256' }
            ]
        };

        for (const order of orders) {
            console.log(`[Perp Matching Engine] Attempting on-chain AMM fill for order ${order.id}`);

            try {
                // Determine numerical market ID (stripping non-digits like frontend)
                const numericalMarketId = BigInt(perpMarketId.replace(/\\D/g, '') || '0');

                // 1. Construct the user's tuple exactly as signed
                const userOrderTuple = {
                    maker: order.trader,
                    marketId: numericalMarketId,
                    isLong: order.side === 'LONG',
                    size: ethers.parseUnits(order.size.toString(), 18),
                    price: ethers.parseUnits(order.price.toString(), 18),
                    margin: ethers.parseUnits(order.margin.toString(), 18),
                    leverage: ethers.parseUnits(order.leverage.toString(), 18),
                    nonce: BigInt(order.nonce),
                    expiration: BigInt(new Date(order.expiration).getTime())
                };

                // 2. Construct the AMM counter-order tuple
                const ammNonce = BigInt(Date.now());
                const ammOrderTuple = {
                    maker: relayer.address,
                    marketId: numericalMarketId,
                    isLong: order.side === 'SHORT', // Opposite side
                    size: userOrderTuple.size,
                    price: userOrderTuple.price,
                    margin: userOrderTuple.margin,
                    leverage: userOrderTuple.leverage,
                    nonce: ammNonce,
                    expiration: BigInt(Date.now() + 86400000)
                };

                // 3. AMM signs the counter-order off-chain
                const ammSignature = await relayer.signTypedData(DOMAIN, TYPES, ammOrderTuple);

                // 4. Relay to Smart Contract
                const longOrder = order.side === 'LONG' ? userOrderTuple : ammOrderTuple;
                const longSignature = order.side === 'LONG' ? order.signature : ammSignature;
                const shortOrder = order.side === 'SHORT' ? userOrderTuple : ammOrderTuple;
                const shortSignature = order.side === 'SHORT' ? order.signature : ammSignature;

                console.log(`[Perp Matching Engine] Submitting to chain: ${process.env.PERP_EXCHANGE_ADDRESS}...`);
                const tx = await exchange.matchPerpOrders(longOrder, longSignature, shortOrder, shortSignature);
                const receipt = await tx.wait();
                const realTxHash = receipt.hash;
                console.log(`[Perp Matching Engine] On-chain match successful! Tx: ${realTxHash}`);

                // 5. Update Database
                await supabase.from('perp_orders').update({ 
                    status: 'FILLED', 
                    filled_amount: order.size 
                }).eq('id', order.id);

                await supabase.from('perp_fills').insert({
                    id: crypto.randomUUID(),
                    network,
                    match_id: realTxHash, // <== REAL TESTNET TX HASH
                    maker_order_id: order.id,
                    taker_order_id: `amm-counter-${ammNonce}`,
                    market_id: perpMarketId,
                    size: order.size,
                    price: order.price
                });

                // 6. Upsert User Position
                const { data: existingPositions } = await supabase
                    .from('perp_positions')
                    .select('*')
                    .eq('trader', order.trader)
                    .eq('market_id', perpMarketId)
                    .eq('network', network)
                    .eq('status', 'OPEN');

                if (existingPositions && existingPositions.length > 0) {
                    const pos = existingPositions[0];
                    let newSize = Number(pos.size);
                    let newMargin = Number(pos.margin);
                    
                    if (pos.side === order.side) {
                        newSize += Number(order.size);
                        newMargin += Number(order.margin);
                    } else {
                        newSize -= Number(order.size);
                    }

                    await supabase.from('perp_positions').update({
                        size: newSize,
                        margin: newMargin,
                        updated_at: new Date().toISOString()
                    }).eq('id', pos.id);
                } else {
                    await supabase.from('perp_positions').insert({
                        id: `${order.trader}-${perpMarketId}-${Date.now()}`,
                        network,
                        trader: order.trader,
                        market_id: perpMarketId,
                        side: order.side,
                        size: order.size,
                        entry_price: order.price,
                        margin: order.margin,
                        leverage: order.leverage,
                        status: 'OPEN'
                    });
                }
            } catch (e: any) {
                console.error(`[Perp Matching Engine] On-chain settlement failed for ${order.id}:`, e.message);
                await supabase.from('perp_orders').update({ status: 'CANCELED' }).eq('id', order.id);
            }
        }
    } catch (e) {
        console.error(`[Perp Matching Engine] Error:`, e);
    }
};

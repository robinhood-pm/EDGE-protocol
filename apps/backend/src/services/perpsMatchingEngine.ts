import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import { getStaticProvider } from '../utils/provider';
import * as dotenv from 'dotenv';

dotenv.config();

const PERP_EXCHANGE_ABI = [
    "function matchPerpOrders(tuple(address maker, uint256 perpMarketId, bool isLong, uint256 size, uint256 price, uint256 margin, uint256 leverage, uint256 nonce, uint256 expiration) longOrder, bytes longSignature, tuple(address maker, uint256 perpMarketId, bool isLong, uint256 size, uint256 price, uint256 margin, uint256 leverage, uint256 nonce, uint256 expiration) shortOrder, bytes shortSignature) external"
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

        const MARGIN_VAULT_ABI = [
            "function availableMargin(address trader) view returns (uint256)",
            "function applyRealizedPnL(address trader, uint256 amount, bool isProfit) external"
        ];

        const provider = getStaticProvider();
        const relayer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider);
        const exchange = new ethers.Contract(process.env.PERP_EXCHANGE_ADDRESS!, PERP_EXCHANGE_ABI, relayer);
        const marginVault = new ethers.Contract(process.env.MARGIN_VAULT_ADDRESS!, MARGIN_VAULT_ABI, relayer);

        const DOMAIN = {
            name: 'EdgeProtocolPerpExchange',
            version: '1',
            chainId: Number(process.env.ROBINHOOD_CHAIN_ID!),
            verifyingContract: process.env.PERP_EXCHANGE_ADDRESS!
        };

        const TYPES = {
            PerpOrder: [
                { name: 'maker', type: 'address' },
                { name: 'perpMarketId', type: 'uint256' },
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
                // Determine numerical market ID (hash the string to get a uint256 compatible number)
                console.log(`[Perp Matching Engine] Converting marketId ${perpMarketId} to BigInt...`);
                const numericalMarketId = BigInt(ethers.id(perpMarketId));

                // 1. Construct the user's tuple exactly as signed
                const userOrderTuple = {
                    maker: order.trader,
                    perpMarketId: numericalMarketId,
                    isLong: order.side === 'LONG',
                    size: ethers.parseUnits(order.size.toString(), 18),
                    price: ethers.parseUnits(order.price.toString(), 18),
                    margin: ethers.parseUnits(order.margin.toString(), 18),
                    leverage: ethers.parseUnits(order.leverage.toString(), 18),
                    nonce: BigInt(order.nonce),
                    expiration: BigInt(new Date(order.expiration).getTime())
                };

                console.log(`[Perp Matching Engine] RECONSTRUCTED TUPLE:`, JSON.stringify({
                    ...userOrderTuple,
                    size: userOrderTuple.size.toString(),
                    price: userOrderTuple.price.toString(),
                    margin: userOrderTuple.margin.toString(),
                    leverage: userOrderTuple.leverage.toString(),
                    perpMarketId: userOrderTuple.perpMarketId.toString(),
                    nonce: userOrderTuple.nonce.toString(),
                    expiration: userOrderTuple.expiration.toString()
                }, null, 2));

                // 2. Construct the AMM counter-order tuple
                const ammNonce = BigInt(Date.now());
                const ammOrderTuple = {
                    maker: relayer.address,
                    perpMarketId: numericalMarketId,
                    isLong: order.side === 'SHORT', // Opposite side
                    size: userOrderTuple.size,
                    price: userOrderTuple.price,
                    margin: userOrderTuple.margin,
                    leverage: userOrderTuple.leverage,
                    nonce: ammNonce,
                    expiration: BigInt(Date.now() + 86400000)
                };

                // 3. AMM signs the counter-order off-chain
                console.log(`[Perp Matching Engine] AMM ORDER TUPLE:`, JSON.stringify({
                    ...ammOrderTuple,
                    size: ammOrderTuple.size.toString(),
                    price: ammOrderTuple.price.toString(),
                    margin: ammOrderTuple.margin.toString(),
                    leverage: ammOrderTuple.leverage.toString(),
                    perpMarketId: ammOrderTuple.perpMarketId.toString(),
                    nonce: ammOrderTuple.nonce.toString(),
                    expiration: ammOrderTuple.expiration.toString()
                }, null, 2));
                console.log(`[Perp Matching Engine] DOMAIN:`, JSON.stringify(DOMAIN, null, 2));
                console.log(`[Perp Matching Engine] Relayer address (signer): ${relayer.address}`);

                const ammSignature = await relayer.signTypedData(DOMAIN, TYPES, ammOrderTuple);
                console.log(`[Perp Matching Engine] AMM Signature: ${ammSignature}`);

                // Verify locally before sending
                const recoveredAddress = ethers.verifyTypedData(DOMAIN, TYPES, ammOrderTuple, ammSignature);
                console.log(`[Perp Matching Engine] LOCAL VERIFY - Recovered: ${recoveredAddress}, Expected: ${ammOrderTuple.maker}, Match: ${recoveredAddress.toLowerCase() === ammOrderTuple.maker.toLowerCase()}`);

                // 3.5 Auto-Fund Trader / AMM Margin on Testnet if insufficient
                try {
                    const traderAvailable: bigint = await marginVault.availableMargin(order.trader);
                    if (traderAvailable < userOrderTuple.margin) {
                        const topUp = userOrderTuple.margin - traderAvailable + ethers.parseUnits("1000", 18);
                        console.log(`[Auto Margin Funder] 💳 Auto-funding ${ethers.formatUnits(topUp, 18)} USDG margin for trader ${order.trader}...`);
                        const fundNonce = await provider.getTransactionCount(relayer.address, 'pending');
                        const fundTx = await marginVault.applyRealizedPnL(order.trader, topUp, true, { nonce: fundNonce });
                        await fundTx.wait();
                        console.log(`[Auto Margin Funder] ✅ Funded trader ${order.trader}`);
                    }

                    const relayerAvailable: bigint = await marginVault.availableMargin(relayer.address);
                    if (relayerAvailable < userOrderTuple.margin) {
                        const topUp = userOrderTuple.margin - relayerAvailable + ethers.parseUnits("10000", 18);
                        console.log(`[Auto Margin Funder] 💳 Auto-funding ${ethers.formatUnits(topUp, 18)} USDG margin for AMM Relayer ${relayer.address}...`);
                        const fundNonce = await provider.getTransactionCount(relayer.address, 'pending');
                        const fundTx = await marginVault.applyRealizedPnL(relayer.address, topUp, true, { nonce: fundNonce });
                        await fundTx.wait();
                        console.log(`[Auto Margin Funder] ✅ Funded AMM Relayer`);
                    }
                } catch (fundErr: any) {
                    console.warn(`[Auto Margin Funder] ⚠️ Could not auto-fund margin: ${fundErr.message || fundErr}`);
                }

                // 4. Relay to Smart Contract
                const longOrder = order.side === 'LONG' ? userOrderTuple : ammOrderTuple;
                const longSignature = order.side === 'LONG' ? order.signature : ammSignature;
                const shortOrder = order.side === 'SHORT' ? userOrderTuple : ammOrderTuple;
                const shortSignature = order.side === 'SHORT' ? order.signature : ammSignature;

                console.log(`[Perp Matching Engine] Submitting to chain: ${process.env.PERP_EXCHANGE_ADDRESS}...`);
                const matchNonce = await provider.getTransactionCount(relayer.address, 'pending');
                const tx = await exchange.matchPerpOrders(longOrder, longSignature, shortOrder, shortSignature, { nonce: matchNonce });
                console.log(`[Perp Matching Engine] Transaction broadcasted. Waiting for confirmation...`);
                const receipt = await tx.wait();
                const realTxHash = receipt.hash;
                console.log(`[Perp Matching Engine] ✅ On-chain match successful! Tx: ${realTxHash}`);

                // 5. Update Database - Order Status
                console.log(`[Perp Matching Engine] Updating order ${order.id} status to FILLED...`);
                await supabase.from('perp_orders').update({
                    status: 'FILLED',
                    filled_amount: order.size
                }).eq('id', order.id);

                console.log(`[Perp Matching Engine] Recording trade in perp_fills...`);
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

                // 5.5 Update Mark Price!
                console.log(`[Perp Matching Engine] 📈 Updating Mark Price for ${perpMarketId} to $${order.price}`);
                await supabase.from('perp_mark_prices').insert({
                    market_id: perpMarketId,
                    network,
                    price: order.price
                });

                // 6. Upsert User Position
                console.log(`[Perp Matching Engine] Updating user position for ${order.trader}...`);
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
                const errMsg = e.message || String(e);
                const isRateLimit = errMsg.includes('429') || errMsg.includes('Too Many Requests') || errMsg.includes('exceeded maximum retry limit') || errMsg.includes('SERVER_ERROR');
                const isInsufficientFunds = errMsg.includes('insufficient funds') || errMsg.includes('INSUFFICIENT_FUNDS');

                if (isRateLimit) {
                    console.warn(`[Perp Matching Engine] ⏳ RPC rate-limited (429/599). Retrying order ${order.id} in next cycle.`);
                } else if (isInsufficientFunds) {
                    console.warn(`[Perp Matching Engine] ⛽ Relayer has insufficient gas funds. Order ${order.id} will remain OPEN until relayer is funded.`);
                } else if (errMsg.includes('fully filled')) {
                    console.log(`[Perp Matching Engine] Order ${order.id} is already filled on-chain. Marking FILLED.`);
                    await supabase.from('perp_orders').update({ status: 'FILLED', filled_amount: order.size }).eq('id', order.id);
                } else {
                    console.error(`[Perp Matching Engine] ❌ On-chain settlement failed for ${order.id}:`, errMsg);
                    console.log(`[Perp Matching Engine] Canceling order ${order.id} due to failure...`);
                    await supabase.from('perp_orders').update({ status: 'CANCELED' }).eq('id', order.id);
                }
            }
            // Small throttle delay between order submissions to prevent Alchemy rate limit bursts
            await new Promise((r) => setTimeout(r, 300));
        }
    } catch (e) {
        console.error(`[Perp Matching Engine] Error:`, e);
    }
};

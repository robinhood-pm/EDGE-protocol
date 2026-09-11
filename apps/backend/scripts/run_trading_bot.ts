import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load backend env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Load 5 bot wallets from contracts/.env
const BOT_WALLETS = [
    new ethers.Wallet(process.env.PRIVKEY_BOT_A!),
    new ethers.Wallet(process.env.PRIVKEY_BOT_B!),
    new ethers.Wallet(process.env.PRIVKEY_BOT_C!),
    new ethers.Wallet(process.env.PRIVKEY_BOT_D!),
    new ethers.Wallet(process.env.PRIVKEY_BOT_E!)
];
let MARKETS: string[] = [];

const INTERVAL_MIN = 2000;  // 2 seconds minimum
const INTERVAL_MAX = 10000; // 10 seconds maximum

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2) {
    const val = (Math.random() * (max - min) + min);
    return parseFloat(val.toFixed(decimals));
}

async function runBot() {
    console.log(`🤖 Starting Trading Bot with ${BOT_WALLETS.length} wallets...`);
    
    // Fetch all available markets dynamically
    const { data: activeMarkets, error } = await supabase.from('perp_markets').select('id');
    if (error || !activeMarkets || activeMarkets.length === 0) {
        console.error('❌ Failed to fetch markets from DB or no markets exist.', error);
        return;
    }
    MARKETS = activeMarkets.map((m: any) => m.id);
    console.log(`🤖 Loaded ${MARKETS.length} markets:`, MARKETS.join(', '));
    
    // Recursive loop with random interval
    const loop = async () => {
        try {
            await executeRandomTrade();
        } catch (e) {
            console.error(`🤖 Bot Error:`, e);
        }
        
        const nextInterval = getRandomInt(INTERVAL_MIN, INTERVAL_MAX);
        setTimeout(loop, nextInterval);
    };

    loop();
}

async function executeRandomTrade() {
    // 1. Pick random market and wallet
    const marketId = MARKETS[getRandomInt(0, MARKETS.length - 1)];
    const wallet = BOT_WALLETS[getRandomInt(0, BOT_WALLETS.length - 1)];

    // 2. Fetch current mark price for realistic pricing
    const { data: stats } = await supabase
        .from('perp_mark_prices')
        .select('price')
        .eq('market_id', marketId)
        .order('timestamp', { ascending: false })
        .limit(1);

    let basePrice = 60000; // default fallback
    if (stats && stats.length > 0) {
        basePrice = Number(stats[0].price);
    }

    // Generate slight deviation in price (-0.1% to +0.1%)
    const deviation = basePrice * getRandomFloat(-0.001, 0.001, 6);
    const orderPrice = (basePrice + deviation).toFixed(2);

    // 3. Randomize order parameters
    const isLong = Math.random() > 0.5;
    const size = getRandomFloat(0.01, 0.5, 4).toString(); // e.g. 0.05 BTC
    const leverage = getRandomInt(2, 20).toString();
    const margin = (Number(size) * Number(orderPrice) / Number(leverage)).toFixed(4);
    
    const nonce = Date.now();
    const expiration = nonce + 86400000; // expires in 24 hours
    
    // Determine numerical market ID (stripping non-digits like frontend)
    const numericalMarketId = BigInt(marketId.replace(/\D/g, '') || '0');

    // 4. Construct Tuple & Sign
    const orderTuple = {
        maker: wallet.address,
        marketId: numericalMarketId,
        isLong: isLong,
        size: ethers.parseUnits(size, 18),
        price: ethers.parseUnits(orderPrice, 18),
        margin: ethers.parseUnits(margin, 18),
        leverage: ethers.parseUnits(leverage, 18),
        nonce: BigInt(nonce),
        expiration: BigInt(expiration)
    };

    const signature = await wallet.signTypedData(DOMAIN, TYPES, orderTuple);

    // 5. Insert to Database
    const orderId = `${wallet.address}-${marketId}-${nonce}`;
    const expirationDate = new Date(expiration).toISOString();

    const { error } = await supabase.from('perp_orders').insert({
        id: orderId,
        network: 'testnet',
        market_id: marketId,
        trader: wallet.address,
        side: isLong ? 'LONG' : 'SHORT',
        size: size,
        price: orderPrice,
        margin: margin,
        leverage: leverage,
        signature: signature,
        nonce: nonce,
        expiration: expirationDate,
        status: 'OPEN'
    });

    if (error) {
        throw new Error(error.message);
    }

    console.log(`🤖 Bot Placed ${isLong ? 'LONG' : 'SHORT'} on ${marketId} | Size: ${size} @ $${orderPrice} | Lev: ${leverage}x`);
}

runBot().catch(console.error);

import { ethers } from 'ethers';
import { supabase } from '../utils/supabase';
import dotenv from 'dotenv';

dotenv.config();

const DOMAIN = {
    name: 'EdgeProtocolPerpExchange',
    version: '1',
    chainId: Number(process.env.ROBINHOOD_CHAIN_ID || 1699),
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

const TICK_INTERVAL_MS = 10 * 60 * 1000;

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 4) {
    const val = (Math.random() * (max - min) + min);
    return parseFloat(val.toFixed(decimals));
}

let botWallets: ethers.Wallet[] = [];

function initWallets() {
    const keys = [
        process.env.PRIVKEY_BOT_A,
        process.env.PRIVKEY_BOT_B,
        process.env.PRIVKEY_BOT_C,
        process.env.PRIVKEY_BOT_D,
        process.env.PRIVKEY_BOT_E
    ].filter(Boolean);

    botWallets = keys.map(k => new ethers.Wallet(k!));
}

const WEATHER_KEYWORDS = ['RAIN', 'TEMP', 'SNOW', 'FIRE', 'HEAT', 'FLOOD', 'TYP3', 'WEATHER'];

function isWeatherMarket(marketId: string): boolean {
    return WEATHER_KEYWORDS.some(k => marketId.includes(k));
}

export function startTradingBotService() {
    initWallets();
    if (botWallets.length === 0) {
        console.warn('⚠️ [Trading Bot Service] No BOT private keys found in ENV. Bot disabled.');
        return;
    }

    console.log(`🤖 [Trading Bot Service] Started with ${botWallets.length} bot wallets (Priority 5:1 Weather vs Crypto).`);

    const loop = async () => {
        try {
            const { data: activeMarkets, error } = await supabase
                .from('perp_markets')
                .select('id')
                .in('status', ['ACTIVE', 'REDUCE_ONLY']);

            if (error || !activeMarkets || activeMarkets.length === 0) return;

            const markets: string[] = activeMarkets.map((m: any) => m.id);

            // Separate into Weather vs Crypto
            const weatherMarkets = markets.filter(m => isWeatherMarket(m));
            const cryptoMarkets = markets.filter(m => !isWeatherMarket(m));

            // Apply 5:1 Ratio Priority (Pick 5 Weather Markets & 1 Crypto Market per tick)
            const countWeather = Math.min(weatherMarkets.length, 5);
            const countCrypto = Math.min(cryptoMarkets.length, 1);

            const shuffledWeather = [...weatherMarkets].sort(() => 0.5 - Math.random());
            const shuffledCrypto = [...cryptoMarkets].sort(() => 0.5 - Math.random());

            const selectedMarkets = [
                ...shuffledWeather.slice(0, countWeather),
                ...shuffledCrypto.slice(0, countCrypto)
            ];

            for (const marketId of selectedMarkets) {
                await placeOrderBookPair(marketId);
            }
        } catch (e: any) {
            console.error(`🤖 [Trading Bot Service] Error:`, e.message || e);
        } finally {
            const intervalMins = Number(process.env.BOT_INTERVAL_MINUTES || 30);
            const intervalMs = Math.max(1, intervalMins) * 60 * 1000;
            setTimeout(loop, intervalMs);
        }
    };

    loop();
}

async function placeOrderBookPair(marketId: string) {
    const isCrypto = !isWeatherMarket(marketId) && (marketId.startsWith('PERP-BTC-') || marketId.startsWith('PERP-ETH-'));

    const { data: markData } = await supabase
        .from('perp_mark_prices')
        .select('price')
        .eq('market_id', marketId)
        .order('timestamp', { ascending: false })
        .limit(1);

    let basePrice = isCrypto ? (marketId.includes('BTC') ? 64000 : 3500) : 0.50;
    if (markData && markData.length > 0 && Number(markData[0].price) > 0) {
        basePrice = Number(markData[0].price);
    }

    const walletIndexA = getRandomInt(0, botWallets.length - 1);
    const walletIndexB = (walletIndexA + 1) % botWallets.length;
    const walletLong = botWallets[walletIndexA];
    const walletShort = botWallets[walletIndexB];

    let longPrice: number;
    let shortPrice: number;
    let sizeStr: string;

    if (isCrypto) {
        const devLong = basePrice * getRandomFloat(0.0005, 0.002, 4);
        const devShort = basePrice * getRandomFloat(0.0005, 0.002, 4);
        longPrice = parseFloat((basePrice - devLong).toFixed(2));
        shortPrice = parseFloat((basePrice + devShort).toFixed(2));
        sizeStr = getRandomFloat(0.01, 0.08, 4).toString();
    } else {
        const devLong = getRandomFloat(0.002, 0.015, 4);
        const devShort = getRandomFloat(0.002, 0.015, 4);
        longPrice = parseFloat(Math.max(0.01, Math.min(0.98, basePrice - devLong)).toFixed(4));
        shortPrice = parseFloat(Math.max(0.02, Math.min(0.99, basePrice + devShort)).toFixed(4));
        sizeStr = getRandomInt(10, 100).toString();
    }

    const leverage = getRandomInt(2, 10).toString();

    await submitBotOrder(walletLong, marketId, true, sizeStr, longPrice.toString(), leverage);
    await submitBotOrder(walletShort, marketId, false, sizeStr, shortPrice.toString(), leverage);
}

async function submitBotOrder(
    wallet: ethers.Wallet,
    marketId: string,
    isLong: boolean,
    size: string,
    orderPrice: string,
    leverage: string
) {
    try {
        const margin = (Number(size) * Number(orderPrice) / Number(leverage)).toFixed(6);
        const nonce = Date.now() + Math.floor(Math.random() * 1000);
        const expiration = nonce + 86400000;
        const numericalMarketId = BigInt(ethers.id(marketId));

        const orderTuple = {
            maker: wallet.address,
            perpMarketId: numericalMarketId,
            isLong: isLong,
            size: ethers.parseUnits(size, 18),
            price: ethers.parseUnits(orderPrice, 18),
            margin: ethers.parseUnits(margin, 18),
            leverage: ethers.parseUnits(leverage, 18),
            nonce: BigInt(nonce),
            expiration: BigInt(expiration)
        };

        const signature = await wallet.signTypedData(DOMAIN, TYPES, orderTuple);
        const expirationDate = new Date(expiration).toISOString();

        await supabase.from('perp_orders').insert({
            id: `${wallet.address}-${marketId}-${nonce}`,
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
    } catch (e: any) {
        // Silent handling
    }
}

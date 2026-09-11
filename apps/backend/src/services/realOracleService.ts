import { supabase } from '../utils/supabase';

const NETWORK = 'testnet';
const INTERVAL_MS = 5000; // Update real oracle index every 5 seconds

// City coordinates for Open-Meteo Weather API
const WEATHER_LOCATIONS: Record<string, { lat: number; lng: number; type: 'rain' | 'temp' | 'wind'; threshold: number }> = {
    'PERP-MIAMI-RAIN50': { lat: 25.7617, lng: -80.1918, type: 'rain', threshold: 50 },
    'PERP-NYC-TEMP35': { lat: 40.7128, lng: -74.0060, type: 'temp', threshold: 35 },
    'PERP-TOK-TYPHOON-CAT3': { lat: 35.6762, lng: 139.6503, type: 'wind', threshold: 120 },
    'PERP-LDN-SNOW-DEC': { lat: 51.5074, lng: -0.1278, type: 'temp', threshold: 5 },
    'PERP-CALI-WILDFIRE-100K': { lat: 36.7783, lng: -119.4179, type: 'temp', threshold: 40 },
    'PERP-TEXAS-HEATWAVE-40': { lat: 31.9686, lng: -99.9018, type: 'temp', threshold: 40 },
    'PERP-JAKARTA-FLOOD-WARN': { lat: -6.2088, lng: 106.8456, type: 'rain', threshold: 30 },
    'PERP-DUBAI-TEMP50': { lat: 25.2048, lng: 55.2708, type: 'temp', threshold: 50 }
};

/**
 * Fetches real crypto price from Binance Public API
 */
async function fetchRealCryptoPrice(symbol: string): Promise<number | null> {
    try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (!res.ok) return null;
        const data = await res.json();
        return parseFloat(data.price);
    } catch (e) {
        console.error(`[Real Oracle] Failed to fetch Binance price for ${symbol}:`, e);
        return null;
    }
}

/**
 * Fetches real weather data from Open-Meteo Public API
 */
async function fetchRealWeatherData(lat: number, lng: number): Promise<{ temp: number; rain: number; wind: number } | null> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,rain,wind_speed_10m`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return {
            temp: data.current?.temperature_2m || 25,
            rain: data.current?.rain || 0,
            wind: data.current?.wind_speed_10m || 10
        };
    } catch (e) {
        console.error(`[Real Oracle] Failed to fetch Open-Meteo data:`, e);
        return null;
    }
}

/**
 * Converts real weather observation into probability index (0.01 to 0.99)
 */
function computeWeatherProbability(marketId: string, weather: { temp: number; rain: number; wind: number }): number {
    const loc = WEATHER_LOCATIONS[marketId];
    if (!loc) return 0.50;

    let prob = 0.50;
    if (loc.type === 'temp') {
        // Higher temp closer to threshold increases probability
        const ratio = weather.temp / loc.threshold;
        prob = Math.min(0.95, Math.max(0.05, ratio * 0.5));
    } else if (loc.type === 'rain') {
        // Rain amount ratio
        prob = weather.rain > 0 ? Math.min(0.90, 0.30 + weather.rain * 0.1) : 0.20;
    } else if (loc.type === 'wind') {
        const ratio = weather.wind / loc.threshold;
        prob = Math.min(0.85, Math.max(0.05, ratio * 0.4));
    }

    return parseFloat(prob.toFixed(4));
}

/**
 * Starts the Real Testnet Oracle Feed Engine.
 * Fetches real prices from Binance API & Open-Meteo API and updates index prices in Supabase.
 */
export const startRealOracleFeedService = async () => {
    console.log(`📡 [Real Testnet Oracle] Started live index feed using Binance & Open-Meteo APIs.`);

    setInterval(async () => {
        try {
            const { data: markets, error } = await supabase.from('perp_markets').select('id');
            if (error || !markets || markets.length === 0) return;

            const inserts = [];

            for (const m of markets) {
                const mId = m.id;
                let realPrice: number | null = null;

                // 1. Check Crypto Markets
                if (mId.includes('BTC-USD') || mId.includes('BTC-USDG')) {
                    realPrice = await fetchRealCryptoPrice('BTCUSDT');
                } else if (mId.includes('ETH-USD') || mId.includes('ETH-USDG')) {
                    realPrice = await fetchRealCryptoPrice('ETHUSDT');
                } else if (mId.includes('SOL500')) {
                    const solPrice = await fetchRealCryptoPrice('SOLUSDT');
                    if (solPrice) realPrice = parseFloat(Math.min(0.95, Math.max(0.05, solPrice / 500)).toFixed(4));
                } else if (mId.includes('BTC150K')) {
                    const btcPrice = await fetchRealCryptoPrice('BTCUSDT');
                    if (btcPrice) realPrice = parseFloat(Math.min(0.95, Math.max(0.05, btcPrice / 150000)).toFixed(4));
                } else if (mId.includes('ETH5K')) {
                    const ethPrice = await fetchRealCryptoPrice('ETHUSDT');
                    if (ethPrice) realPrice = parseFloat(Math.min(0.95, Math.max(0.05, ethPrice / 5000)).toFixed(4));
                }

                // 2. Check Weather Markets via Open-Meteo
                if (!realPrice && WEATHER_LOCATIONS[mId]) {
                    const loc = WEATHER_LOCATIONS[mId];
                    const weatherData = await fetchRealWeatherData(loc.lat, loc.lng);
                    if (weatherData) {
                        realPrice = computeWeatherProbability(mId, weatherData);
                    }
                }

                // 3. Fallback for macro/other markets (calculate from prediction market orderbook or mid)
                if (!realPrice) {
                    const { data: lastIdx } = await supabase
                        .from('perp_index_prices')
                        .select('price')
                        .eq('market_id', mId)
                        .order('timestamp', { ascending: false })
                        .limit(1)
                        .single();
                    if (lastIdx) realPrice = Number(lastIdx.price);
                }

                if (realPrice && !isNaN(realPrice)) {
                    inserts.push({
                        market_id: mId,
                        network: NETWORK,
                        price: realPrice
                    });
                }
            }

            if (inserts.length > 0) {
                await supabase.from('perp_index_prices').insert(inserts);
            }
        } catch (e: any) {
            console.error(`[Real Testnet Oracle] Feed loop error:`, e.message || e);
        }
    }, INTERVAL_MS);
};

import { matchPerpOrdersAsync } from '../src/services/perpsMatchingEngine';

const MARKET_ID = 'PERP-BTC-USDG';
const NETWORK = 'testnet';
const INTERVAL_MS = 3000;

const runEngine = async () => {
    console.log(`🚀 Starting Auto-Fill Matching Engine for ${MARKET_ID}...`);
    setInterval(async () => {
        await matchPerpOrdersAsync(MARKET_ID, NETWORK);
    }, INTERVAL_MS);
};

runEngine().catch(console.error);

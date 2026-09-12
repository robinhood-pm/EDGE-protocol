import { ethers } from 'ethers';
import { supabase } from '../utils/supabase';
import { createCallout } from './calloutService';
import dotenv from 'dotenv';

dotenv.config();

let isCalloutBotRunning = false;
let botWallets: ethers.Wallet[] = [];

function initWallets(): ethers.Wallet[] {
  const envKeys = [
    process.env.PRIVKEY_BOT_A,
    process.env.PRIVKEY_BOT_B,
    process.env.PRIVKEY_BOT_C,
    process.env.PRIVKEY_BOT_D,
    process.env.PRIVKEY_BOT_E,
    process.env.PRIVKEY_BOT_F,
    process.env.PRIVKEY_BOT_G,
    process.env.PRIVKEY_BOT_H,
    process.env.PRIVKEY_BOT_I,
    process.env.PRIVKEY_BOT_J,
  ].filter(Boolean) as string[];

  return envKeys.map((pk) => new ethers.Wallet(pk));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -------------------------------------------------------------------------
// EXTENDED MARKET-AWARE NARRATIVE BANK (HUMAN-LIKE 15-35 WORDS)
// -------------------------------------------------------------------------

const WEATHER_YES_HEADLINES = [
  'Precipitation radar accumulation looks heavy',
  'Atmospheric humidity breaking local thresholds',
  'Heatwave index pushing past upper limits',
  'NWS radar reflectivity model showing high density',
  'Cloud cover density confirming rain front incoming',
];

const WEATHER_YES_THESES = [
  'Radar imagery and precipitation models for ${marketTitle} are showing steady accumulation. Taking a YES position at $${currentPrice} with solid conviction.',
  'Atmospheric humidity indices are breaking local thresholds for ${marketTitle}. Positioned YES with tight risk bounds at $${currentPrice}.',
  'Heatwave sensor readings in target region confirm upper temperature threshold breach for ${marketTitle}. Going YES at $${currentPrice}.',
  'High-resolution satellite feeds indicate heavy rain front advancing for ${marketTitle}. Locking in YES position at $${currentPrice}.',
];

const WEATHER_NO_HEADLINES = [
  'Barometric pressure stabilizing across region',
  'Surface temp holding below peak target limits',
  'Cloud density clearing out over target area',
  'Weather sensor data showing dry front dominance',
];

const WEATHER_NO_THESES = [
  'Barometric pressure levels remain stable while cloud cover clears out for ${marketTitle}. Taking a NO entry at $${currentPrice} for steady yield.',
  'Surface temperature readings are holding well below peak target limits for ${marketTitle}. Opening NO position at $${currentPrice}.',
  'Low humidity readings and stable wind vectors indicate dry conditions for ${marketTitle}. Taking tactical NO at $${currentPrice}.',
];

const CRYPTO_YES_HEADLINES = [
  'Orderbook liquidity depth showing strong bid support',
  'Technical indicators on 4h confirming bullish reversal',
  'Futures open interest breaking key resistance levels',
  'Accumulation volume surging on orderbook depth',
  'Breakout momentum holding strong above support',
];

const CRYPTO_YES_THESES = [
  'Orderbook liquidity depth for ${marketTitle} shows strong buying interest around $${currentPrice}. Entering LONG with balanced risk-reward ratio.',
  'Technical indicators on 4h timeframe confirm a bullish reversal for ${marketTitle}. Accumulating YES contracts at $${currentPrice}.',
  'Volume weighted average price holding solid support for ${marketTitle}. Positioning YES at $${currentPrice} expecting upside continuation.',
  'Futures open interest is breaking key resistance levels for ${marketTitle}. Opening bullish callout at $${currentPrice}.',
];

const CRYPTO_NO_HEADLINES = [
  'Local resistance rejected twice with declining open interest',
  'Momentum oscillators indicate overbought conditions',
  'Ask side liquidity depth stacking heavily above resistance',
  'Bearish divergence on 4h RSI timeframe',
];

const CRYPTO_NO_THESES = [
  'Local resistance for ${marketTitle} rejected twice with declining open interest. Positioned SHORT at $${currentPrice} expecting lower range retest.',
  'Momentum oscillators indicate overbought conditions on ${marketTitle}. Taking a tactical NO position at $${currentPrice}.',
  'Ask side liquidity depth is stacking heavily above current price for ${marketTitle}. Positioning NO at $${currentPrice} for range equilibrium.',
];

const GENERAL_YES_HEADLINES = [
  'Catalyst milestones lining up as scheduled',
  'Sentiment metrics and news flow favoring resolution',
  'Market probability underpricing resolution odds',
  'Favorable risk-reward opportunity on high confidence target',
];

const GENERAL_YES_THESES = [
  'Recent sentiment metrics and news flow around ${marketTitle} suggest high probability of resolution. Entering YES at $${currentPrice}.',
  'Key milestone catalysts for ${marketTitle} are lining up as scheduled. Positioning YES at $${currentPrice} with balanced risk bounds.',
  'Statistical probability model indicates market is underpricing resolution odds for ${marketTitle}. Taking YES at $${currentPrice}.',
];

const GENERAL_NO_HEADLINES = [
  'Probability model showing market overpricing resolution timeline',
  'Key milestone delays reducing resolution likelihood',
  'Risk-reward ratio heavily favoring short side',
];

const GENERAL_NO_THESES = [
  'Probability models show market overpricing resolution timeline for ${marketTitle}. Taking a NO position at $${currentPrice} for range equilibrium.',
  'Delays in catalyst milestones reduce resolution odds for ${marketTitle}. Positioned NO at $${currentPrice} with strict risk management.',
];

function generateNarrative(marketTitle: string, category: string, conviction: 'YES' | 'NO', currentPrice: number) {
  const cat = category.toUpperCase();
  let headlineList: string[];
  let thesisList: string[];

  if (cat.includes('WEATHER') || cat.includes('RAIN') || cat.includes('TEMP')) {
    headlineList = conviction === 'YES' ? WEATHER_YES_HEADLINES : WEATHER_NO_HEADLINES;
    thesisList = conviction === 'YES' ? WEATHER_YES_THESES : WEATHER_NO_THESES;
  } else if (cat.includes('CRYPTO') || cat.includes('PERP') || cat.includes('ETH') || cat.includes('BTC')) {
    headlineList = conviction === 'YES' ? CRYPTO_YES_HEADLINES : CRYPTO_NO_HEADLINES;
    thesisList = conviction === 'YES' ? CRYPTO_YES_THESES : CRYPTO_NO_THESES;
  } else {
    headlineList = conviction === 'YES' ? GENERAL_YES_HEADLINES : GENERAL_NO_HEADLINES;
    thesisList = conviction === 'YES' ? GENERAL_YES_THESES : GENERAL_NO_THESES;
  }

  const rawHeadline = getRandomItem(headlineList);
  const rawThesis = getRandomItem(thesisList);

  const priceFormatted = currentPrice.toFixed(2);
  const headline = `${rawHeadline} on ${marketTitle}`;
  const thesis = rawThesis
    .replace(/\$\{marketTitle\}/g, marketTitle)
    .replace(/\$\{currentPrice\}/g, priceFormatted);

  return { headline, thesis };
}

export function startCalloutBotService() {
  if (isCalloutBotRunning) return;
  isCalloutBotRunning = true;

  botWallets = initWallets();
  if (botWallets.length === 0) {
    console.warn('⚠️ [Callout Prophet Bot] No PRIVKEY_BOT_* found in ENV. Callout bot disabled.');
    isCalloutBotRunning = false;
    return;
  }

  console.log(`🤖 [Callout Prophet Bot] Service started with ${botWallets.length} bot signers.`);

  const loop = async () => {
    try {
      const network = (process.env.NETWORK || 'testnet').toLowerCase();

      // 1. Fetch active bot profiles from users database
      const walletAddresses = botWallets.map((w) => w.address.toLowerCase());
      let { data: botProfiles, error: profileErr } = await supabase
        .from('users')
        .select('id, wallet_address, handle, display_name')
        .in('wallet_address', walletAddresses);

      if (profileErr || !botProfiles || botProfiles.length === 0) {
        const { data: fallbackProfiles } = await supabase
          .from('users')
          .select('id, wallet_address, handle, display_name')
          .limit(10);

        if (!fallbackProfiles || fallbackProfiles.length === 0) {
          console.warn('🤖 [Callout Prophet Bot] Waiting for bot profiles to be seeded in users table...');
          return;
        }
        botProfiles = fallbackProfiles;
      }

      // 2. Fetch spot prediction markets strictly from database (NO perps, NO hardcoded fallback)
      const { data: spotMarkets } = await supabase.from('markets').select('*');

      if (!spotMarkets || spotMarkets.length === 0) {
        console.warn('🤖 [Callout Prophet Bot] No spot markets found in markets table...');
        return;
      }

      const allMarkets = spotMarkets.map((m) => ({
        id: m.id,
        title: m.title || m.id,
        category: m.category || 'WEATHER',
        probability: Number(m.current_yes_probability || 50),
      }));

      // 3. Select random bot creator & random market
      const botProfile = getRandomItem(botProfiles);
      const market = getRandomItem(allMarkets);

      const conviction: 'YES' | 'NO' = Math.random() > 0.4 ? 'YES' : 'NO';
      const callProbability = Math.max(10, Math.min(90, getRandomInt(market.probability - 8, market.probability + 8)));
      const confidence = getRandomInt(75, 95);
      const priceNum = callProbability / 100;

      const { headline, thesis } = generateNarrative(market.title, market.category, conviction, priceNum);

      const deadline = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      // 4. Create Callout in database via calloutService
      const callout = await createCallout({
        creatorId: botProfile.id || botProfile.wallet_address,
        headline,
        thesis,
        category: market.category,
        conviction,
        confidence,
        marketId: market.id,
        callProbability,
        deadline,
        network: network as any,
      });

      console.log(
        `🤖 [Callout Prophet Bot] 🔮 Posted Callout by @${botProfile.handle} [${conviction}] on "${market.title}" (ID: ${callout.id.slice(0, 8)}...)`
      );
    } catch (err: any) {
      console.error('🤖 [Callout Prophet Bot] ⚠️ Error during callout generation:', err.message || err);
    } finally {
      // Human Micro-Behavior: Random delay around 10 minutes (9-11 mins)
      const randomDelay = getRandomInt(9 * 60 * 1000, 11 * 60 * 1000);
      setTimeout(loop, randomDelay);
    }
  };

  // Launch initial tick & batch seed if callout count is low
  setTimeout(async () => {
    try {
      const { count } = await supabase.from('callouts').select('*', { count: 'exact', head: true });
      if (!count || count < 10) {
        console.log('🤖 [Callout Prophet Bot] Seeding initial batch of 10 callouts...');
        for (let i = 0; i < 10; i++) {
          await loop();
        }
      } else {
        await loop();
      }
    } catch (e) {
      loop();
    }
  }, 2000);
}

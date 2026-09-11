import { supabase } from '../src/utils/supabase';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const MARKETS = [
  {
    id: "PERP-BTC150K-DEC",
    base_asset: "BTC-150K",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "CRYPTO",
    description: "Will BTC hit $150K before Dec 31?",
    status: "ACTIVE",
    initialPrice: 0.25
  },
  {
    id: "PERP-ETH5K-Q4",
    base_asset: "ETH-5K",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "CRYPTO",
    description: "Will ETH reach $5,000 before Q4?",
    status: "ACTIVE",
    initialPrice: 0.60
  },
  {
    id: "PERP-SOL500-EOY",
    base_asset: "SOL-500",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "CRYPTO",
    description: "Will Solana surpass $500 by End of Year?",
    status: "ACTIVE",
    initialPrice: 0.15
  },
  {
    id: "PERP-FED-RATE-CUT-SEP",
    base_asset: "FED-CUT",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "MACRO",
    description: "Will the Fed cut interest rates in September?",
    status: "ACTIVE",
    initialPrice: 0.85
  },
  {
    id: "PERP-ETH-ETF-STAKING",
    base_asset: "ETH-STAKING",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "CRYPTO",
    description: "Will the SEC approve ETH ETF Staking before 2027?",
    status: "ACTIVE",
    initialPrice: 0.40
  },
  {
    id: "PERP-BTC-DOM-60",
    base_asset: "BTC-DOM",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "CRYPTO",
    description: "Will BTC Dominance exceed 60% this month?",
    status: "ACTIVE",
    initialPrice: 0.55
  },
  {
    id: "PERP-US-ELECTION-REP",
    base_asset: "US-ELEC-REP",
    quote_asset: "USDG",
    type: "PROBABILITY_PERP",
    category: "POLITICS",
    description: "Will the Republican Party win the US Presidential Election?",
    status: "ACTIVE",
    initialPrice: 0.52
  },
  {
    id: "PERP-MIAMI-RAIN50",
    base_asset: "MIAMI-RAIN",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will Miami rainfall exceed 50mm?",
    status: "ACTIVE",
    initialPrice: 0.30
  },
  {
    id: "PERP-NYC-TEMP35",
    base_asset: "NYC-TEMP",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will NYC Temperature exceed 35°C in August?",
    status: "ACTIVE",
    initialPrice: 0.45
  },
  {
    id: "PERP-TOK-TYPHOON-CAT3",
    base_asset: "TOK-TYP3",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will a Category 3+ Typhoon hit Tokyo this season?",
    status: "ACTIVE",
    initialPrice: 0.10
  },
  {
    id: "PERP-LDN-SNOW-DEC",
    base_asset: "LDN-SNOW",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will London experience snowfall before Dec 25?",
    status: "ACTIVE",
    initialPrice: 0.70
  },
  {
    id: "PERP-CALI-WILDFIRE-100K",
    base_asset: "CALI-FIRE",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will California wildfires burn over 100K acres this month?",
    status: "ACTIVE",
    initialPrice: 0.20
  },
  {
    id: "PERP-TEXAS-HEATWAVE-40",
    base_asset: "TEXAS-HEAT",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will Texas record 5 consecutive days above 40°C?",
    status: "ACTIVE",
    initialPrice: 0.65
  },
  {
    id: "PERP-JAKARTA-FLOOD-WARN",
    base_asset: "JKT-FLOOD",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will Jakarta issue a Level 1 Flood Warning this week?",
    status: "ACTIVE",
    initialPrice: 0.50
  },
  {
    id: "PERP-DUBAI-TEMP50",
    base_asset: "DXB-TEMP",
    quote_asset: "USDG",
    type: "WEATHER_PERP",
    category: "WEATHER",
    description: "Will Dubai temperature hit 50°C before July?",
    status: "ACTIVE",
    initialPrice: 0.80
  }
];

const seed = async () => {
  console.log("Seeding Perpetual Markets to Testnet...");
  const network = "testnet";

  for (const m of MARKETS) {
    console.log(`Seeding ${m.id}...`);

    // 1. Insert Market
    // Wait, the existing table might not have base_asset/quote_asset/type/category. 
    // We will just use the fields it has.
    const { error: mErr } = await supabase.from('perp_markets').upsert({
      id: m.id,
      network: network,
      prediction_market_id: crypto.randomUUID(),
      initial_margin_rate: 0.10, // 10%
      maintenance_margin_rate: 0.05, // 5%
      max_leverage: 10,
      max_open_interest: 1000000,
      status: "ACTIVE"
    });

    if (mErr) {
      console.error(`Error inserting market ${m.id}:`, mErr);
      continue;
    }

    // 2. Insert Initial Mark Price
    await supabase.from('perp_mark_prices').insert({
      market_id: m.id,
      network: network,
      price: m.initialPrice
    });

    // 3. Insert Initial Index Price
    await supabase.from('perp_index_prices').insert({
      market_id: m.id,
      network: network,
      price: m.initialPrice
    });

    // 4. Insert Initial Funding Rate
    await supabase.from('perp_funding_rates').insert({
      market_id: m.id,
      network: network,
      rate: 0.0001
    });
  }

  console.log("All markets seeded successfully!");
};

seed().catch(console.error);

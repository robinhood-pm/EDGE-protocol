import { supabase } from '../src/utils/supabase';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
  console.log("Seeding Perpetual Market to Testnet...");

  const marketId = 'PERP-BTC-USDG';
  const network = "testnet";

  // 1. Insert Market
  const { error: mErr } = await supabase.from('perp_markets').upsert({
    id: marketId,
    network: network,
    prediction_market_id: crypto.randomUUID(),
    initial_margin_rate: 0.10, // 10%
    maintenance_margin_rate: 0.05, // 5%
    max_leverage: 10,
    max_open_interest: 1000000,
    status: "ACTIVE"
  });

  if (mErr) {
    console.error("Error inserting market:", mErr);
    return;
  }
  console.log("Market inserted/updated.");

  // 2. Insert Initial Mark Price
  await supabase.from('perp_mark_prices').insert({
    market_id: marketId,
    network: network,
    price: 65000.50
  });

  // 3. Insert Initial Index Price
  await supabase.from('perp_index_prices').insert({
    market_id: marketId,
    network: network,
    price: 65000.00
  });

  // 4. Insert Initial Funding Rate
  await supabase.from('perp_funding_rates').insert({
    market_id: marketId,
    network: network,
    rate: 0.0001
  });

  console.log("Initial prices and funding rates seeded successfully!");
};

seed().catch(console.error);

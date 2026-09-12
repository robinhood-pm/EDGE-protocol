import { ethers } from 'ethers';
import { supabase } from '../utils/supabase';
import { matchOrdersAsync } from './matchingEngine';
import dotenv from 'dotenv';

dotenv.config();

const TICK_INTERVAL_MS = 10 * 60 * 1000;
let botWallets: ethers.Wallet[] = [];
let isBotLoopRunning = false;

const BOT_PROFILES_DATA: Record<number, {
  handle: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  xHandle: string;
  edgeScore: number;
  accuracy: number;
  resolvedCalls: number;
  followersCount: number;
  volumeAttributed: number;
}> = {
  0: { handle: 'AlphaQuant', displayName: 'Alpha Quant MM', bio: 'Automated High-Frequency Market Maker for Edge Protocol.', avatarSeed: 'AlphaQuant', xHandle: 'alphaquant', edgeScore: 98.4, accuracy: 89.2, resolvedCalls: 42, followersCount: 1250, volumeAttributed: 450000 },
  1: { handle: 'NexusMM', displayName: 'Nexus Liquidity', bio: 'Institutional prediction market liquidity provider.', avatarSeed: 'NexusMM', xHandle: 'nexusmm', edgeScore: 95.1, accuracy: 86.5, resolvedCalls: 38, followersCount: 980, volumeAttributed: 380000 },
  2: { handle: 'HyperTrader', displayName: 'HyperTrader AI', bio: 'AI-driven algorithmic spot & perps market maker.', avatarSeed: 'HyperTrader', xHandle: 'hypertrader', edgeScore: 92.8, accuracy: 84.1, resolvedCalls: 35, followersCount: 870, volumeAttributed: 310000 },
  3: { handle: 'DeltaHedge', displayName: 'Delta Hedge Algo', bio: 'Delta-neutral market making algorithm.', avatarSeed: 'DeltaHedge', xHandle: 'deltahedge', edgeScore: 89.5, accuracy: 81.7, resolvedCalls: 29, followersCount: 720, volumeAttributed: 270000 },
  4: { handle: 'SigmaAlgo', displayName: 'Sigma Quant', bio: 'Quantitative trading engine & market maker.', avatarSeed: 'SigmaAlgo', xHandle: 'sigmaalgo', edgeScore: 87.2, accuracy: 79.4, resolvedCalls: 24, followersCount: 610, volumeAttributed: 220000 },
  5: { handle: 'ApexLiquid', displayName: 'Apex Market Maker', bio: 'Top-tier liquidity provider on Robinhood chain.', avatarSeed: 'ApexLiquid', xHandle: 'apexliquid', edgeScore: 85.0, accuracy: 78.0, resolvedCalls: 22, followersCount: 540, volumeAttributed: 190000 },
  6: { handle: 'SolarisBot', displayName: 'Solaris Trader', bio: 'High-frequency weather & crypto prediction bot.', avatarSeed: 'SolarisBot', xHandle: 'solarisbot', edgeScore: 82.6, accuracy: 76.5, resolvedCalls: 19, followersCount: 480, volumeAttributed: 165000 },
  7: { handle: 'VortexMM', displayName: 'Vortex Liquidity', bio: 'Automated orderbook liquidity & spread stabilizer.', avatarSeed: 'VortexMM', xHandle: 'vortexmm', edgeScore: 80.1, accuracy: 74.8, resolvedCalls: 16, followersCount: 410, volumeAttributed: 140000 },
  8: { handle: 'ZenithTrader', displayName: 'Zenith Trading', bio: 'Strategic algorithmic trader for Edge Protocol.', avatarSeed: 'ZenithTrader', xHandle: 'zenithtrader', edgeScore: 78.3, accuracy: 72.9, resolvedCalls: 14, followersCount: 360, volumeAttributed: 120000 },
  9: { handle: 'PulseQuant', displayName: 'Pulse Quant Bot', bio: 'Real-time oracle event & sentiment market maker.', avatarSeed: 'PulseQuant', xHandle: 'pulsequant', edgeScore: 76.0, accuracy: 71.0, resolvedCalls: 12, followersCount: 300, volumeAttributed: 95000 },
};

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

async function seedBotProfilesAndStats(wallets: ethers.Wallet[]) {
  console.log(`🤖 [Spot Market Maker Bot] Seeding user profiles & leaderboard stats for ${wallets.length} bot wallets...`);
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const normalizedWallet = wallet.address.toLowerCase();
    const info = BOT_PROFILES_DATA[i] || {
      handle: `bot_${normalizedWallet.slice(2, 8)}`,
      displayName: `Market Maker Bot ${i + 1}`,
      bio: 'Automated market making algorithm.',
      avatarSeed: `bot_${i}`,
      xHandle: `bot_${i}`,
      edgeScore: 75.0,
      accuracy: 70.0,
      resolvedCalls: 10,
      followersCount: 200,
      volumeAttributed: 50000,
    };

    const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${info.avatarSeed}`;

    const networkEnv = (process.env.NETWORK || 'testnet').toLowerCase();
    // 1. Seed users table directly (Single source of truth)
    try {
      const { data: profile } = await supabase
        .from('users')
        .upsert(
          {
            wallet_address: normalizedWallet,
            network: networkEnv,
            username: info.handle,
            handle: info.handle,
            display_name: info.displayName,
            bio: info.bio,
            avatar_url: avatarUrl,
            x_handle: info.xHandle,
            is_verified: true,
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          },
          { onConflict: 'wallet_address, network' }
        )
        .select('*')
        .single();

      // 3. Seed creator_stats for Leaderboard
      if (profile) {
        for (const net of ['testnet', 'TESTNET', 'mainnet', 'MAINNET']) {
          await supabase.from('creator_stats').upsert(
            {
              profile_id: profile.id,
              network: net,
              edge_score: info.edgeScore,
              accuracy: info.accuracy,
              resolved_calls: info.resolvedCalls,
              followers_count: info.followersCount,
              volume_attributed: info.volumeAttributed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'profile_id, network' }
          );
        }
      }
    } catch (err: any) {
      console.warn(`🤖 [Spot Market Maker Bot] Warning seeding bot profile ${normalizedWallet}:`, err.message || err);
    }
  }
  console.log(`🤖 [Spot Market Maker Bot] ✅ Bot profiles & leaderboard stats initialized successfully.`);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

export function startSpotTradingBotService() {
  if (isBotLoopRunning) return;
  isBotLoopRunning = true;

  botWallets = initWallets();
  if (botWallets.length === 0) {
    console.warn('⚠️ [Spot Market Maker Bot] No PRIVKEY_BOT_* found in ENV. Spot bot disabled.');
    isBotLoopRunning = false;
    return;
  }

  console.log(`🤖 [Spot Market Maker Bot] Service started on server with ${botWallets.length} bot wallets.`);
  seedBotProfilesAndStats(botWallets);
  console.log(`🤖 [Spot Market Maker Bot] Monitoring active spot prediction markets every ${TICK_INTERVAL_MS / 1000}s...`);

  const loop = async () => {
    try {
      const network = (process.env.NETWORK || 'TESTNET').toUpperCase();

      // Fetch open prediction markets
      const { data: activeMarkets, error } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'OPEN');

      if (error) {
        console.error(`🤖 [Spot Market Maker Bot] Error fetching spot markets: ${error.message}`);
        return;
      }

      if (!activeMarkets || activeMarkets.length === 0) {
        console.log(`🤖 [Spot Market Maker Bot] ⏳ No active spot prediction markets found in DB.`);
        return;
      }

      // Pick a random market and a random bot wallet
      const market = activeMarkets[Math.floor(Math.random() * activeMarkets.length)];
      const botWallet = botWallets[Math.floor(Math.random() * botWallets.length)];

      const outcome = Math.random() > 0.5 ? 1 : 0; // 1 = YES, 0 = NO
      const isBuy = Math.random() > 0.3; // 70% buy, 30% sell
      const sideText = outcome === 1 ? 'YES' : 'NO';
      const actionText = isBuy ? 'BUY' : 'SELL';
      const actionEmoji = isBuy ? '🟢' : '🔴';

      const currentProb = Number(market.current_yes_probability || 50) / 100;
      const priceNum = Math.max(0.05, Math.min(0.95, getRandomFloat(currentProb - 0.08, currentProb + 0.08, 2)));
      const priceContract = BigInt(Math.floor(priceNum * 1e6));

      const inputAmount = getRandomInt(10, 50);
      let sharesContract: bigint;
      if (isBuy) {
        sharesContract = (BigInt(inputAmount * 1e6) * BigInt(1e6)) / priceContract;
      } else {
        sharesContract = BigInt(inputAmount * 1e6);
      }

      const exchangeAddress = process.env.EXCHANGE_ADDRESS;
      const chainIdEnv = process.env.ROBINHOOD_CHAIN_ID;

      if (!exchangeAddress || !chainIdEnv) {
        console.error(`🤖 [Spot Market Maker Bot] Missing EXCHANGE_ADDRESS or ROBINHOOD_CHAIN_ID in ENV.`);
        return;
      }

      const domain = {
        name: 'EdgeProtocolExchange',
        version: '1',
        chainId: Number(chainIdEnv),
        verifyingContract: exchangeAddress as `0x${string}`,
      };

      const types = {
        Order: [
          { name: 'maker', type: 'address' },
          { name: 'marketId', type: 'uint256' },
          { name: 'outcome', type: 'uint8' },
          { name: 'amount', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'isBuy', type: 'bool' },
          { name: 'nonce', type: 'uint256' },
          { name: 'expiration', type: 'uint256' },
        ],
      };

      let marketIdBigInt: bigint;
      try {
        marketIdBigInt = BigInt(market.id);
      } catch {
        marketIdBigInt = BigInt(ethers.keccak256(ethers.toUtf8Bytes(market.id)));
      }

      const orderTuple = {
        maker: botWallet.address,
        marketId: marketIdBigInt,
        outcome: outcome,
        amount: sharesContract,
        price: priceContract,
        isBuy: isBuy,
        nonce: BigInt(Date.now() + getRandomInt(100, 9999)),
        expiration: BigInt(Math.floor(Date.now() / 1000) + 86400),
      };

      const signature = await botWallet.signTypedData(domain, types, orderTuple);

      const rawOrderForBackend = {
        maker: orderTuple.maker,
        marketId: orderTuple.marketId.toString(),
        outcome: orderTuple.outcome,
        amount: orderTuple.amount.toString(),
        price: orderTuple.price.toString(),
        isBuy: orderTuple.isBuy,
        nonce: orderTuple.nonce.toString(),
        expiration: orderTuple.expiration.toString(),
      };

      // Ensure user entry exists to prevent FK violation
      await supabase.from('users').upsert(
        { wallet_address: botWallet.address.toLowerCase(), network },
        { onConflict: 'wallet_address, network' }
      );

      const sharesAmount = Number(ethers.formatUnits(sharesContract, 6));

      // Insert Spot Order into database
      const { data: insertedOrder, error: insertErr } = await supabase
        .from('orders')
        .insert([
          {
            market_id: market.id,
            network,
            wallet_address: botWallet.address.toLowerCase(),
            side: sideText,
            order_type: 'LIMIT',
            amount: sharesAmount,
            price: priceNum,
            signature,
            status: 'PENDING',
          },
        ])
        .select('*')
        .single();

      if (insertErr) {
        console.error(`🤖 [Spot Market Maker Bot] ❌ Failed to insert spot order: ${insertErr.message}`);
        return;
      }

      const walletShort = `${botWallet.address.slice(0, 6)}...${botWallet.address.slice(-4)}`;
      console.log(
        `🤖 [Spot Market Maker Bot] ${actionEmoji} ${actionText} ${sideText} | Market: "${market.title || market.id}" | Price: $${priceNum.toFixed(2)} | Shares: ${sharesAmount.toFixed(2)} | Wallet: ${walletShort} | Order ID: ${insertedOrder.id}`
      );

      // Record activity in DB logs table for auditing
      try {
        await supabase.from('logs').insert([
          {
            network,
            wallet_address: botWallet.address.toLowerCase(),
            action: `SPOT_BOT_${actionText}_${sideText}`,
            details: JSON.stringify({
              market_id: market.id,
              market_title: market.title,
              price: priceNum,
              shares: sharesAmount,
              order_id: insertedOrder.id,
            }),
          },
        ]);
      } catch (logDbErr) {
        // Non-blocking error handling
      }

      // Trigger automatic matching engine for this spot market
      matchOrdersAsync(market.id, network);
    } catch (err: any) {
      console.error(`🤖 [Spot Market Maker Bot] ⚠️ Exception during spot bot tick:`, err.message || err);
    } finally {
      setTimeout(loop, TICK_INTERVAL_MS);
    }
  };

  loop();
}

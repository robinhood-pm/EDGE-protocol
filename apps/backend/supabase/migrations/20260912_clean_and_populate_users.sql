-- ====================================================================
-- Edge Protocol — Clean & Populate Users Table Migration (FOOLPROOF)
-- Target: Supabase PostgreSQL
-- ====================================================================

-- Step 1: Delete duplicate rows with uppercase network/wallet first to avoid PK collision
DELETE FROM public.users
WHERE network <> LOWER(network) 
   OR wallet_address <> LOWER(wallet_address);

-- Step 2: Ensure any remaining rows are lowercased
UPDATE public.users 
SET 
  wallet_address = LOWER(wallet_address),
  network = LOWER(network);

-- Step 3: Upsert clean unique user profiles (No underscores, unique names)
INSERT INTO public.users (wallet_address, network, username, handle, display_name, bio, avatar_url, x_handle, is_verified, updated_at)
VALUES
  -- 1. Market Maker Bots (Updated without underscores)
  ('0x0d4370e1d441088897d684b983735767f1b3e086', 'testnet', 'AlphaQuant', 'AlphaQuant', 'Alpha Quant MM', 'Automated High-Frequency Market Maker for Edge Protocol.', 'https://api.dicebear.com/9.x/bottts/svg?seed=AlphaQuant', 'alphaquant', true, NOW()),
  ('0xba642acaf7d6f495369f2d64155c89e9a50902f0', 'testnet', 'NexusMM', 'NexusMM', 'Nexus Liquidity', 'Institutional prediction market liquidity provider.', 'https://api.dicebear.com/9.x/bottts/svg?seed=NexusMM', 'nexusmm', true, NOW()),
  ('0xe9e4b92d58f1146f927a696d728f79f797d55caa', 'testnet', 'HyperTrader', 'HyperTrader', 'HyperTrader AI', 'AI-driven algorithmic spot & perps market maker.', 'https://api.dicebear.com/9.x/bottts/svg?seed=HyperTrader', 'hypertrader', true, NOW()),
  ('0x3a2ac33e6aedca79eb1b93d3d1bb558bb7961fe9', 'testnet', 'DeltaHedge', 'DeltaHedge', 'Delta Hedge Algo', 'Delta-neutral market making algorithm.', 'https://api.dicebear.com/9.x/bottts/svg?seed=DeltaHedge', 'deltahedge', true, NOW()),
  ('0xc223ff40e02f246c7b5da4aed69b5101f4aa3795', 'testnet', 'SigmaAlgo', 'SigmaAlgo', 'Sigma Quant', 'Quantitative trading engine & market maker.', 'https://api.dicebear.com/9.x/bottts/svg?seed=SigmaAlgo', 'sigmaalgo', true, NOW()),
  ('0x247025a8c6a7d19925e059e9271426bbf90b7115', 'testnet', 'ApexLiquid', 'ApexLiquid', 'Apex Market Maker', 'Top-tier liquidity provider on Robinhood chain.', 'https://api.dicebear.com/9.x/bottts/svg?seed=ApexLiquid', 'apexliquid', true, NOW()),
  ('0xd398475e2ce30f8c9bd19009cc0aa9255b6a7f77', 'testnet', 'SolarisBot', 'SolarisBot', 'Solaris Trader', 'High-frequency weather & crypto prediction bot.', 'https://api.dicebear.com/9.x/bottts/svg?seed=SolarisBot', 'solarisbot', true, NOW()),
  ('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 'testnet', 'VortexMM', 'VortexMM', 'Vortex Liquidity', 'Automated orderbook liquidity & spread stabilizer.', 'https://api.dicebear.com/9.x/bottts/svg?seed=VortexMM', 'vortexmm', true, NOW()),
  ('0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 'testnet', 'ZenithTrader', 'ZenithTrader', 'Zenith Trading', 'Strategic algorithmic trader for Edge Protocol.', 'https://api.dicebear.com/9.x/bottts/svg?seed=ZenithTrader', 'zenithtrader', true, NOW()),
  ('0x84a856dcc618eaa8812c01066f3db16e3c805201', 'testnet', 'PulseQuant', 'PulseQuant', 'Pulse Quant Bot', 'Real-time oracle event & sentiment market maker.', 'https://api.dicebear.com/9.x/bottts/svg?seed=PulseQuant', 'pulsequant', true, NOW()),

  -- 2. System Relayer Wallet
  ('0x4aedef2aa208737a2c672ec65402419c284e00ff', 'testnet', 'ZeroNode', 'ZeroNode', 'Zero Node Relayer', 'Official Edge Protocol transaction relayer.', 'https://api.dicebear.com/9.x/identicon/svg?seed=ZeroNode', 'zeronode', true, NOW()),

  -- 3. Anonymous Individual Pseudonym Users (No Underscores)
  ('0x10de88094b2274306cca63dc2eccc6cef5a6712e', 'testnet', 'Cipher', 'Cipher', 'Cipher', 'Anonymous prediction trader on Edge Protocol.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Cipher', 'cipher', false, NOW()),
  ('0x1563915e194d8cfba1943570603f7606a3115508', 'testnet', 'Vanta', 'Vanta', 'Vanta', 'Quantitative prediction caller.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Vanta', 'vanta', false, NOW()),
  ('0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a', 'testnet', 'Shade', 'Shade', 'Shade', 'Macro and weather prediction enthusiast.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Shade', 'shade', false, NOW()),
  ('0x2ac4882f8d883c87507eb50c773d4eda4be3ff96', 'testnet', 'Nox', 'Nox', 'Nox', 'On-chain prediction market caller.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Nox', 'nox', false, NOW()),
  ('0x5cbdd86a2fa8dc4bdd8a8f69dba48572eec07fb', 'testnet', 'Veil', 'Veil', 'Veil', 'DeFi & crypto market predictor.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Veil', 'veil', false, NOW()),
  ('0x7564105e977516c53be337314c7e53838967bdac', 'testnet', 'Wraith', 'Wraith', 'Wraith', 'High frequency prediction caller.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Wraith', 'wraith', false, NOW()),
  ('0x7e52273b07a2172346037dc71c7fbe94f304db55', 'testnet', 'Specter', 'Specter', 'Specter', 'Autonomous trading and prediction node.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Specter', 'specter', false, NOW()),
  ('0x8d9b4d275223d39cd58cd099835218df3c828978', 'testnet', 'Obsidian', 'Obsidian', 'Obsidian', 'Weather & macro odds researcher.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Obsidian', 'obsidian', false, NOW()),
  ('0xa4e78af8fcc4f58e1472fcd34899faaa0ece7772', 'testnet', 'Phantom', 'Phantom', 'Phantom', 'Crypto prediction market analyst.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Phantom', 'phantom', false, NOW()),
  ('0xaa40b15380d91da92d51f21c06c6480d1850692d', 'testnet', 'Eclipse', 'Eclipse', 'Eclipse', 'Decentralized prediction market liquidity provider.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Eclipse', 'eclipse', false, NOW()),
  ('0xc1658460cf53082a73f34362cb895d5fd7b308c3', 'testnet', 'Unknown', 'Unknown', 'Unknown Trader', 'Anonymous prediction market trader.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Unknown', 'unknown', false, NOW()),
  ('0xc3da7c0c55143ecb83d6161efc934059530d6fd9', 'testnet', 'Anonymous', 'Anonymous', 'Anonymous', 'Prediction market oracle participant.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Anonymous', 'anonymous', false, NOW()),
  ('0xe1fae9b4fab2f5726677ecfa912d96b0b683e6a9', 'testnet', 'Nobody', 'Nobody', 'Nobody', 'Silent prediction market researcher.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Nobody', 'nobody', false, NOW()),
  ('0xe62a034a7cadf778c4a56e1e14b90086b97ab3dd', 'testnet', 'Nameless', 'Nameless', 'Nameless', 'On-chain prediction market caller.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Nameless', 'nameless', false, NOW()),
  ('0xff1eca63ab9fe33f81307977fa86bbef35191334', 'testnet', 'Faceless', 'Faceless', 'Faceless', 'Decentralized oracle trader.', 'https://api.dicebear.com/9.x/identicon/svg?seed=Faceless', 'faceless', false, NOW())
ON CONFLICT (wallet_address, network) DO UPDATE SET
  username = EXCLUDED.username,
  handle = EXCLUDED.handle,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  x_handle = EXCLUDED.x_handle,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- Step 4: Clean up any old test callouts whose creator_id no longer exists in users
DELETE FROM public.callouts 
WHERE creator_id NOT IN (SELECT id FROM public.users);

-- Step 5: Safely update callouts foreign key constraint to reference public.users(id)
ALTER TABLE public.callouts DROP CONSTRAINT IF EXISTS callouts_creator_id_fkey;
ALTER TABLE public.callouts ADD CONSTRAINT callouts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;

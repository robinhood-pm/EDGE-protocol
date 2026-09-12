-- ==========================================
-- EDGE PROTOCOL - SUPABASE SCHEMA
-- ==========================================

-- 1. Markets Table
-- Stores market metadata exposed to the frontend
CREATE TABLE IF NOT EXISTS public.markets (
    id TEXT, -- Usually matches the onchain questionId
    network TEXT, -- 'TESTNET' or 'MAINNET'
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    image_url TEXT,
    resolution_rules TEXT,
    close_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, RESOLVED, INVALIDATED
    resolver_address TEXT NOT NULL,
    total_volume_usdg NUMERIC DEFAULT 0,
    current_yes_probability NUMERIC DEFAULT 50.0,
    winning_outcome TEXT, -- 'YES' or 'NO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, network)
);

-- 2. Users Table (Unified Social & Trading Layer)
-- Stores user profiles, social metadata, and trading metrics
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'TESTNET', -- 'TESTNET' or 'MAINNET'
    username TEXT,
    handle TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    x_handle TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    total_trades INTEGER DEFAULT 0,
    historical_pnl_usdg NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (wallet_address, network)
);

-- 3. Orders Table
-- Stores the Central Limit Order Book (CLOB) offchain
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid(),
    network TEXT, -- 'TESTNET' or 'MAINNET'
    market_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    side TEXT NOT NULL, -- 'YES' or 'NO'
    order_type TEXT NOT NULL, -- 'LIMIT' or 'MARKET'
    amount NUMERIC NOT NULL, -- Number of tokens
    price NUMERIC NOT NULL, -- Price per token (e.g. 0.5 for 50 cents)
    signature TEXT NOT NULL, -- EIP-712 Signature
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, FILLED, PARTIALLY_FILLED, CANCELLED
    filled_amount NUMERIC DEFAULT 0,
    raw_order JSONB, -- The EIP-712 payload needed for matching
    transaction_hash TEXT, -- To track the onchain settlement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_market FOREIGN KEY (market_id, network) REFERENCES public.markets(id, network) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (wallet_address, network) REFERENCES public.users(wallet_address, network) ON DELETE CASCADE
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- By default, everything is secured. Only the backend (Service Role) can bypass.
-- If direct access from frontend is needed, RLS must be configured specifically.

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Logs Table
-- Stores system activities and audit trails
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network TEXT NOT NULL,
    wallet_address TEXT,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to markets (SELECT)
DROP POLICY IF EXISTS "Allow public read-only access to markets" ON public.markets;
CREATE POLICY "Allow public read-only access to markets" 
ON public.markets FOR SELECT USING (true);

-- Allow public read-only access to orders (SELECT) for realtime orderbook
DROP POLICY IF EXISTS "Allow public read-only access to orders" ON public.orders;
CREATE POLICY "Allow public read-only access to orders" 
ON public.orders FOR SELECT USING (true);

-- Backend using Service Role will automatically bypass this RLS.

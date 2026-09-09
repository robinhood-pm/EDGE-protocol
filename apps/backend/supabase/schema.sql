-- ==========================================
-- EDGE PROTOCOL - SUPABASE SCHEMA
-- ==========================================

-- 1. Markets Table
-- Stores market metadata exposed to the frontend
CREATE TABLE IF NOT EXISTS public.markets (
    id TEXT PRIMARY KEY, -- Usually matches the onchain questionId
    title TEXT NOT NULL,
    description TEXT,
    close_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, RESOLVED, INVALIDATED
    resolver_address TEXT NOT NULL,
    total_volume_usdg NUMERIC DEFAULT 0,
    current_yes_probability NUMERIC DEFAULT 50.0,
    winning_outcome TEXT, -- 'YES' or 'NO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table
-- Stores user profiles and static metrics
CREATE TABLE IF NOT EXISTS public.users (
    wallet_address TEXT PRIMARY KEY,
    username TEXT,
    total_trades INTEGER DEFAULT 0,
    historical_pnl_usdg NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Orders Table
-- Stores the Central Limit Order Book (CLOB) offchain
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    side TEXT NOT NULL, -- 'YES' or 'NO'
    order_type TEXT NOT NULL, -- 'LIMIT' or 'MARKET'
    amount NUMERIC NOT NULL, -- Number of tokens
    price NUMERIC NOT NULL, -- Price per token (e.g. 0.5 for 50 cents)
    signature TEXT NOT NULL, -- EIP-712 Signature
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, FILLED, PARTIALLY_FILLED, CANCELLED
    filled_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- By default, everything is secured. Only the backend (Service Role) can bypass.
-- If direct access from frontend is needed, RLS must be configured specifically.

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to markets (SELECT)
CREATE POLICY "Allow public read-only access to markets" 
ON public.markets FOR SELECT USING (true);

-- Backend using Service Role will automatically bypass this RLS.

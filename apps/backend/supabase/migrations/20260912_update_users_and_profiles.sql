-- ====================================================================
-- Edge Protocol — User & Profile Table Synchronization Migration
-- Target: Supabase PostgreSQL
-- ====================================================================

-- 1. Ensure public.profiles table exists with all profile fields
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    handle VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    x_handle VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add profile columns to public.users table for backward compatibility & direct user queries
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS x_handle TEXT;

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON public.users(wallet_address);

-- 4. Enable RLS & set viewable policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users are insertable and updatable by service role or public" ON public.profiles;
CREATE POLICY "Users are insertable and updatable by service role or public" ON public.profiles FOR ALL USING (true);

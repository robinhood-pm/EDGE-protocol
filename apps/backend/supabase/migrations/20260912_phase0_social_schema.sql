-- ====================================================================
-- Edge Protocol — Social Prediction Markets + Callout Layer
-- Phase 0: Database Schema Migration Script
-- Target: Supabase PostgreSQL
-- ====================================================================

-- 1. Profiles Table
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

-- 2. Profile Links Table
CREATE TABLE IF NOT EXISTS public.profile_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform VARCHAR(30) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Callouts Table
CREATE TABLE IF NOT EXISTS public.callouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet', -- 'testnet' | 'mainnet'
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    thesis TEXT,
    category VARCHAR(50) NOT NULL,
    conviction VARCHAR(10) NOT NULL CHECK (conviction IN ('YES', 'NO')),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 50 AND 99),
    market_id VARCHAR(100), -- Can link to existing prediction market or perps market
    market_proposal_id UUID, -- Optional link to market proposal
    call_probability NUMERIC(5,2) NOT NULL, -- Snapshot probability at call time
    current_probability NUMERIC(5,2) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LIVE' CHECK (status IN ('LIVE', 'WON', 'LOST', 'INVALID', 'EXPIRED', 'MARKET_PENDING')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 4. Callout Snapshots Table (Immutable Snapshot at Call Time)
CREATE TABLE IF NOT EXISTS public.callout_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    probability_at_call NUMERIC(5,2) NOT NULL,
    market_id VARCHAR(100) NOT NULL,
    market_rules_hash VARCHAR(66),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Callout Market Links Table
CREATE TABLE IF NOT EXISTS public.callout_market_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    market_id VARCHAR(100) NOT NULL,
    linked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Callout Results Table
CREATE TABLE IF NOT EXISTS public.callout_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    outcome VARCHAR(10) NOT NULL CHECK (outcome IN ('YES', 'NO', 'INVALID')),
    prediction_edge NUMERIC(8,2) NOT NULL, -- Prediction Edge Points calculated at resolution
    resolved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);

-- 8. Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, callout_id)
);

-- 9. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Comment Likes Table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, comment_id)
);

-- 11. Reposts Table
CREATE TABLE IF NOT EXISTS public.reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    quote TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Saves Table
CREATE TABLE IF NOT EXISTS public.saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, callout_id)
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_callout', 'counter_call', 'probability_moved', 'callout_won', 'callout_lost', 'new_follower', 'reply', 'trending'
    ref_id VARCHAR(100),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Notification Settings Table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    value BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, setting_key)
);

-- 15. Creator Stats Table
CREATE TABLE IF NOT EXISTS public.creator_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_calls INTEGER DEFAULT 0,
    resolved_calls INTEGER DEFAULT 0,
    correct_calls INTEGER DEFAULT 0,
    incorrect_calls INTEGER DEFAULT 0,
    accuracy NUMERIC(5,2) DEFAULT 0.00,
    edge_score NUMERIC(10,2) DEFAULT 0.00,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    avg_call_probability NUMERIC(5,2) DEFAULT 0.00,
    volume_attributed NUMERIC(18,2) DEFAULT 0.00,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (network, profile_id)
);

-- 16. Creator Score History Table
CREATE TABLE IF NOT EXISTS public.creator_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    edge_score NUMERIC(10,2) NOT NULL,
    accuracy NUMERIC(5,2) NOT NULL,
    snapshot_date DATE DEFAULT CURRENT_DATE
);

-- 17. Leaderboard Snapshots Table
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    period VARCHAR(10) NOT NULL CHECK (period IN ('24h', '7d', '30d', 'all_time')),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    edge_score NUMERIC(10,2) NOT NULL,
    accuracy NUMERIC(5,2) NOT NULL,
    resolved_calls INTEGER NOT NULL,
    volume_attributed NUMERIC(18,2) NOT NULL,
    snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Trade Attribution Table
CREATE TABLE IF NOT EXISTS public.trade_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trader_address VARCHAR(42) NOT NULL,
    market_id VARCHAR(100) NOT NULL,
    volume NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Callout Views Table
CREATE TABLE IF NOT EXISTS public.callout_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    callout_id UUID NOT NULL REFERENCES public.callouts(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Market Proposals Table
CREATE TABLE IF NOT EXISTS public.market_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network VARCHAR(20) NOT NULL DEFAULT 'testnet',
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    yes_condition TEXT NOT NULL,
    no_condition TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    resolution_source TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- 21. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Moderation Actions Table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE & FAST QUERYING BY NETWORK
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_callouts_network_status ON public.callouts(network, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callouts_creator ON public.callouts(network, creator_id);
CREATE INDEX IF NOT EXISTS idx_callouts_market ON public.callouts(network, market_id);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_callout ON public.likes(callout_id);
CREATE INDEX IF NOT EXISTS idx_comments_callout ON public.comments(callout_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(network, user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_stats_rank ON public.creator_stats(network, edge_score DESC, accuracy DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles, callouts, comments, likes, follows
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public callouts are viewable by everyone" ON public.callouts FOR SELECT USING (true);
CREATE POLICY "Public comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Public follows are viewable by everyone" ON public.follows FOR SELECT USING (true);

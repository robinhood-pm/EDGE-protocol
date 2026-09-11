-- ==============================================================================
-- Edge Protocol: Perpetual Markets Expansion (Phase 2)
-- Database Schema for Perps
-- ==============================================================================

-- 1. Perp Markets
CREATE TABLE IF NOT EXISTS public.perp_markets (
    id TEXT PRIMARY KEY, 
    network TEXT NOT NULL, -- e.g., 'testnet', 'mainnet'
    prediction_market_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, REDUCE_ONLY, PAUSED, CLOSED, SETTLED
    max_leverage NUMERIC NOT NULL,
    initial_margin_rate NUMERIC NOT NULL,
    maintenance_margin_rate NUMERIC NOT NULL,
    max_open_interest NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Perp Orders (EIP-712 Signed Orders)
CREATE TABLE IF NOT EXISTS public.perp_orders (
    id TEXT PRIMARY KEY,
    network TEXT NOT NULL,
    market_id TEXT NOT NULL REFERENCES public.perp_markets(id),
    trader TEXT NOT NULL,
    side TEXT NOT NULL, -- LONG, SHORT
    size NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    margin NUMERIC NOT NULL,
    leverage NUMERIC NOT NULL,
    signature TEXT NOT NULL,
    nonce NUMERIC NOT NULL,
    expiration TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, PARTIAL, FILLED, CANCELED
    filled_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Perp Fills (Matched Trades)
CREATE TABLE IF NOT EXISTS public.perp_fills (
    id TEXT PRIMARY KEY,
    network TEXT NOT NULL,
    match_id TEXT NOT NULL, -- Hash of the on-chain match transaction
    maker_order_id TEXT NOT NULL REFERENCES public.perp_orders(id),
    taker_order_id TEXT NOT NULL REFERENCES public.perp_orders(id),
    market_id TEXT NOT NULL REFERENCES public.perp_markets(id),
    size NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Perp Positions
CREATE TABLE IF NOT EXISTS public.perp_positions (
    id TEXT PRIMARY KEY,
    network TEXT NOT NULL,
    trader TEXT NOT NULL,
    market_id TEXT NOT NULL REFERENCES public.perp_markets(id),
    side TEXT NOT NULL, -- LONG, SHORT
    size NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    margin NUMERIC NOT NULL,
    leverage NUMERIC NOT NULL,
    unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
    realized_pnl NUMERIC NOT NULL DEFAULT 0,
    funding_accrued NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, LIQUIDATED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Perp Funding Rates (History)
CREATE TABLE IF NOT EXISTS public.perp_funding_rates (
    id TEXT PRIMARY KEY,
    network TEXT NOT NULL,
    market_id TEXT NOT NULL REFERENCES public.perp_markets(id),
    rate NUMERIC NOT NULL,
    mark_price NUMERIC NOT NULL,
    index_price NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Perp Liquidations
CREATE TABLE IF NOT EXISTS public.perp_liquidations (
    id TEXT PRIMARY KEY,
    network TEXT NOT NULL,
    trader TEXT NOT NULL,
    market_id TEXT NOT NULL REFERENCES public.perp_markets(id),
    position_id TEXT NOT NULL REFERENCES public.perp_positions(id),
    mark_price NUMERIC NOT NULL,
    penalty_amount NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Time-series: Index & Mark Prices
CREATE TABLE IF NOT EXISTS public.perp_index_prices (
    market_id TEXT NOT NULL,
    network TEXT NOT NULL,
    price NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.perp_mark_prices (
    market_id TEXT NOT NULL,
    network TEXT NOT NULL,
    price NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_perp_orders_market_status ON public.perp_orders(market_id, status);
CREATE INDEX IF NOT EXISTS idx_perp_positions_market_status ON public.perp_positions(market_id, status);
CREATE INDEX IF NOT EXISTS idx_perp_positions_trader ON public.perp_positions(trader);
CREATE INDEX IF NOT EXISTS idx_perp_index_prices_time ON public.perp_index_prices(market_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perp_mark_prices_time ON public.perp_mark_prices(market_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perp_markets_network ON public.perp_markets(network);

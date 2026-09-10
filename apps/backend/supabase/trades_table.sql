-- ==========================================
-- TRADES TABLE - Historical Price Data
-- ==========================================

CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network TEXT NOT NULL,
    market_id TEXT NOT NULL,
    buy_order_id UUID,
    sell_order_id UUID,
    price NUMERIC NOT NULL,
    amount NUMERIC NOT NULL,
    buyer_address TEXT NOT NULL,
    seller_address TEXT NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_trade_market FOREIGN KEY (market_id, network) 
        REFERENCES public.markets(id, network) ON DELETE CASCADE
);

-- Index for fast chart queries
CREATE INDEX IF NOT EXISTS idx_trades_market_time ON public.trades(market_id, network, created_at DESC);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Allow public read access for chart data
DROP POLICY IF EXISTS "Allow public read trades" ON public.trades;
CREATE POLICY "Allow public read trades" ON public.trades FOR SELECT USING (true);

import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

/**
 * GET /api/perps
 * Lists all active perpetual markets.
 */
export const getPerpMarkets = async (req: Request, res: Response) => {
    try {
        const { network = 'testnet' } = req.query;
        const { data: markets, error } = await supabase
            .from('perp_markets')
            .select('*')
            .eq('network', network as string);

        if (error) throw error;

        res.json({ success: true, markets });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/perps/:marketId
 * Gets details of a specific perpetual market including mark and index prices.
 */
export const getPerpMarketDetail = async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;
        const { network = 'testnet' } = req.query;

        const { data: market, error: mErr } = await supabase
            .from('perp_markets')
            .select('*')
            .eq('id', marketId)
            .ilike('network', network as string)
            .single();

        if (mErr) throw mErr;

        const { data: markPrice } = await supabase.from('perp_mark_prices').select('price').eq('market_id', marketId).order('timestamp', { ascending: false }).limit(1).single();
        const { data: indexPrice } = await supabase.from('perp_index_prices').select('price').eq('market_id', marketId).order('timestamp', { ascending: false }).limit(1).single();
        const { data: fundingRate } = await supabase.from('perp_funding_rates').select('rate').eq('market_id', marketId).order('timestamp', { ascending: false }).limit(1).single();

        // Fetch last 50 mark prices for the chart
        const { data: priceHistoryData } = await supabase
            .from('perp_mark_prices')
            .select('price, timestamp')
            .eq('market_id', marketId)
            .order('timestamp', { ascending: false })
            .limit(50);
            
        // Reverse so the oldest is first, newest is last (left to right on chart)
        const priceHistory = priceHistoryData ? priceHistoryData.reverse() : [];

        res.json({
            success: true,
            market: {
                ...market,
                currentMarkPrice: markPrice?.price || null,
                currentIndexPrice: indexPrice?.price || null,
                currentFundingRate: fundingRate?.rate || null,
                priceHistory
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/perps/:marketId/orderbook
 * Gets the open orderbook for a perp market.
 */
export const getPerpOrderbook = async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;
        const { network = 'testnet' } = req.query;

        const { data: orders, error } = await supabase
            .from('perp_orders')
            .select('*')
            .eq('market_id', marketId)
            .ilike('network', network as string)
            .eq('status', 'OPEN');

        if (error) throw error;

        const longs = orders.filter(o => o.side === 'LONG').sort((a, b) => Number(b.price) - Number(a.price));
        const shorts = orders.filter(o => o.side === 'SHORT').sort((a, b) => Number(a.price) - Number(b.price));

        res.json({ success: true, orderbook: { bids: longs, asks: shorts } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/perps/orders
 * Submits a new EIP-712 signed perp order.
 */
export const submitPerpOrder = async (req: Request, res: Response) => {
    try {
        const { network = 'testnet', marketId, trader, side, size, price, margin, leverage, signature, nonce, expiration } = req.body;
        
        // 1. Basic Validation
        if (!marketId || !trader || !side || !size || !price || !margin || !leverage || !signature || nonce == null || !expiration) {
            return res.status(400).json({ success: false, error: 'Missing required order fields' });
        }

        // Generate ID
        const orderId = `${trader}-${marketId}-${nonce}`;

        // Convert expiration from Unix ms to ISO string for TIMESTAMPTZ column
        const expirationDate = new Date(Number(expiration)).toISOString();

        // Insert into DB as OPEN
        const { error } = await supabase.from('perp_orders').insert({
            id: orderId,
            network,
            market_id: marketId,
            trader,
            side,
            size,
            price,
            margin,
            leverage,
            signature,
            nonce,
            expiration: expirationDate,
            status: 'OPEN'
        });

        if (error) throw error;

        res.json({ success: true, message: 'Perp order submitted', orderId });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/perps/positions
 * Get user's open perp positions
 */
export const getPerpPositions = async (req: Request, res: Response) => {
    try {
        const { trader, network = 'testnet' } = req.query;
        
        if (!trader) {
            return res.status(400).json({ success: false, error: 'Trader address required' });
        }

        const { data: positions, error } = await supabase
            .from('perp_positions')
            .select('*')
            .ilike('trader', trader as string)
            .ilike('network', network as string)
            .eq('status', 'OPEN');

        if (error) throw error;

        res.json({ success: true, positions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

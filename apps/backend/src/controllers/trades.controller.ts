import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getMarketTrades = async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const rangeParam = req.query.range as string; // '1h', '6h', '24h', '7d', 'all'
    const range = rangeParam ? rangeParam.toLowerCase() : 'all';
    const network = process.env.NETWORK || 'TESTNET';

    let query = supabase
      .from('trades')
      .select('id, price, amount, buyer_address, seller_address, transaction_hash, created_at')
      .eq('market_id', marketId)
      .eq('network', network)
      .order('created_at', { ascending: true });

    // Apply time range filter
    if (range && range !== 'all') {
      const now = new Date();
      let since: Date;
      switch (range) {
        case '1h':
          since = new Date(now.getTime() - 1 * 60 * 60 * 1000);
          break;
        case '6h':
          since = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const chartData = (data || []).map(trade => ({
      time: new Date(trade.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: trade.created_at,
      price: Math.round(Number(trade.price) * 100), // Convert 0.50 → 50 cents
      amount: Number(trade.amount),
    }));

    res.json({ trades: chartData, total: chartData.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getUserPortfolio = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const network = process.env.NETWORK || 'TESTNET';

    // Fetch all FILLED orders for this user
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, markets(title, image_url)')
      .eq('wallet_address', address)
      .eq('network', network)
      .eq('status', 'FILLED');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Aggregate positions by market
    const positions: Record<string, any> = {};

    orders?.forEach(order => {
      const marketId = order.market_id;
      if (!positions[marketId]) {
        positions[marketId] = {
          marketId,
          marketTitle: order.markets?.title || 'Unknown Market',
          marketImage: order.markets?.image_url || '',
          yesShares: 0,
          noShares: 0,
          totalInvested: 0
        };
      }

      const shares = Number(order.amount);
      const cost = (Number(order.price) * shares) / 1000000; // price is in 1e6

      if (order.side === 'YES') {
        positions[marketId].yesShares += shares;
      } else {
        positions[marketId].noShares += shares;
      }

      positions[marketId].totalInvested += cost;
    });

    res.json({ positions: Object.values(positions) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

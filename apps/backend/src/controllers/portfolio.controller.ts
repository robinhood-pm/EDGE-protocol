import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getUserPortfolio = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const network = process.env.NETWORK || 'TESTNET';

    // Fetch all orders for this user
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, markets(title, image_url, slug)')
      .ilike('wallet_address', String(address))
      .eq('network', String(network));

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Aggregate positions by market
    const positions: Record<string, any> = {};

    orders?.forEach(order => {
      const marketId = order.market_id;

      if (order.status === 'FILLED') {
        if (!positions[marketId]) {
          positions[marketId] = {
            marketId,
            marketTitle: order.markets?.title || 'Unknown Market',
            marketImage: order.markets?.image_url || '',
            marketSlug: order.markets?.slug || '',
            yesShares: 0,
            noShares: 0,
            totalInvested: 0
          };
        }

        const shares = Number(order.amount);
        const cost = (Number(order.price) * shares) / 100; // price is in cents (1-99), cost in USD

        if (order.side === 'YES') {
          positions[marketId].yesShares += shares;
        } else {
          positions[marketId].noShares += shares;
        }

        positions[marketId].totalInvested += cost;
      }
    });

    // Sort orders by most recent for history
    const history = orders?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

    res.json({ positions: Object.values(positions), history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

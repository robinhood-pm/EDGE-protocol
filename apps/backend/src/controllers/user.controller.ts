import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', address)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows returned
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({ user: { wallet_address: address, historical_pnl_usdg: 0, total_trades: 0 } });
    }

    res.json({ user: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

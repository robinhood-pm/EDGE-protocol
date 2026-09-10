import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const createLog = async (req: Request, res: Response) => {
  try {
    const { wallet_address, action, details } = req.body;
    const network = process.env.NETWORK || 'TESTNET';

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    const { error } = await supabase
      .from('logs')
      .insert([
        {
          network,
          wallet_address: wallet_address || null,
          action,
          details: details || null
        }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

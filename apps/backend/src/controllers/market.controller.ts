import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ markets: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

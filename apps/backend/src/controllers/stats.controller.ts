import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const network = process.env.NETWORK || 'TESTNET';
    
    // 1. Markets Data
    const { data: marketsData, error: marketsError } = await supabase
      .from('markets')
      .select('status, total_volume_usdg')
      .ilike('network', network);
      
    if (marketsError) throw marketsError;
    
    let totalVolume = 0;
    let resolvedCount = 0;
    
    marketsData?.forEach(m => {
      totalVolume += Number(m.total_volume_usdg || 0);
      if (m.status === 'RESOLVED') {
        resolvedCount++;
      }
    });

    // 2. Orders Data
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('wallet_address')
      .ilike('network', network);
      
    if (ordersError) throw ordersError;
    
    const predictionsMade = ordersData?.length || 0;
    
    const tradersSet = new Set();
    ordersData?.forEach(o => tradersSet.add(o.wallet_address));
    const activeTraders = tradersSet.size;

    res.json({
      totalVolume,
      predictionsMade,
      activeTraders,
      marketsResolved: resolvedCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

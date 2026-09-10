import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

// Helper to format currency
const formatPrice = (priceStr: string) => {
  return parseFloat(priceStr);
};

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const network = process.env.NETWORK || 'TESTNET';
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('network', network)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formattedMarkets = data.map(market => ({
      id: market.id,
      title: market.title,
      slug: market.slug,
      image: market.image_url || 'https://via.placeholder.com/150',
      status: market.status === 'OPEN' ? 'Live' : market.status,
      totalVolume: Number(market.total_volume_usdg),
      currentPrice: Number(market.current_yes_probability) / 100
    }));

    res.json({ markets: formattedMarkets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMarketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const network = process.env.NETWORK || 'TESTNET';

    // 1. Fetch Market Detail
    let query = supabase
      .from('markets')
      .select('*')
      .eq('network', network);

    const idStr = Array.isArray(id) ? id[0] : id;

    // If id contains only numbers, check by ID, else check by slug
    if (/^\d+$/.test(idStr || '')) {
      query = query.eq('id', idStr);
    } else {
      query = query.eq('slug', idStr);
    }

    const { data: marketData, error: marketError } = await query.single();

    if (marketError || !marketData) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // 2. Fetch Active Orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketData.id)
      .eq('network', network)
      .in('status', ['PENDING', 'PARTIALLY_FILLED']);

    if (ordersError) {
      return res.status(500).json({ error: ordersError.message });
    }

    // 3. Aggregate Orderbook
    const bidsMap: { [price: number]: number } = {};
    const asksMap: { [price: number]: number } = {};

    let highestBid = 0;

    ordersData.forEach(order => {
      // In prediction markets, if side is 'YES', they are buying YES (bids)
      // if side is 'NO', they are buying NO, which is equivalent to selling YES (asks) at price (1 - orderPrice).
      // But for simplicity in the UI right now, we assume price is represented in cents (e.g. 500000 = 50 cents)
      // We will normalize it to standard units for UI (e.g. 0.36)
      // Or we can just sum up the raw shares.
      
      const priceScaled = Number(order.price); // already 0.50
      const amountRemaining = (Number(order.amount) - Number(order.filled_amount)); // already 10
      
      if (order.side === 'YES') { // BUY
        if (!bidsMap[priceScaled]) bidsMap[priceScaled] = 0;
        bidsMap[priceScaled] += amountRemaining;
        
        if (priceScaled > highestBid) highestBid = priceScaled;
      } else if (order.side === 'NO') { // SELL
        if (!asksMap[priceScaled]) asksMap[priceScaled] = 0;
        asksMap[priceScaled] += amountRemaining;
      }
    });

    const bids = Object.keys(bidsMap).map(price => ({
      price: Math.round(Number(price) * 100), // convert 0.50 to 50 cents
      shares: bidsMap[Number(price)],
      total: Number(price) * bidsMap[Number(price)] * 100 // assuming total in USD (price in cents)
    })).sort((a, b) => b.price - a.price);

    const asks = Object.keys(asksMap).map(price => ({
      price: Math.round(Number(price) * 100),
      shares: asksMap[Number(price)],
      total: Number(price) * asksMap[Number(price)] * 100
    })).sort((a, b) => a.price - b.price);

    // Format final response to match frontend expectations
    const response = {
      id: marketData.id,
      title: marketData.title,
      description: marketData.description,
      image: marketData.image_url,
      status: marketData.status === 'OPEN' ? 'Live' : marketData.status,
      totalVolume: Number(marketData.total_volume_usdg),
      priceToBeat: 0.50, // mock calculation
      currentPrice: highestBid > 0 ? highestBid : Number(marketData.current_yes_probability) / 100,
      priceChangePercent: 0,
      timeLeft: 'N/A', // could be calculated from close_time
      resolutionRules: marketData.resolution_rules || 'No rules specified.',
      rewards: {
        pointsToEarn: 50
      },
      orderBook: {
        bids,
        asks
      }
    };

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMarket = async (req: Request, res: Response) => {
  try {
    const { id, title, slug, description, image_url, resolution_rules, close_time, resolver_address } = req.body;
    const network = process.env.NETWORK || 'TESTNET';

    if (!id || !title || !close_time || !resolver_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('markets')
      .insert([
        {
          id: id.toString(),
          network,
          title,
          slug,
          description,
          image_url,
          resolution_rules,
          close_time: new Date(close_time * 1000).toISOString(),
          resolver_address,
          status: 'OPEN',
          total_volume_usdg: 0,
          current_yes_probability: 50.0
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ market: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

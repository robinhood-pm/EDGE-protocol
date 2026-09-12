import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';

// Helper to format currency
const formatPrice = (priceStr: string) => {
  return parseFloat(priceStr);
};

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const network = (process.env.NETWORK || 'TESTNET').toLowerCase();
    const { filter, category } = req.query;

    console.log(`[MarketController] Fetching markets: filter=${filter || 'all'}, category=${category || 'all'}`);

    let query = supabase.from('markets').select('*');

    // Dynamic filters
    if (filter === 'Live') {
      query = query.eq('status', 'OPEN');
    }

    // Category filter
    if (category) {
      query = query.ilike('category', String(category));
    }

    // Ordering based on filter
    if (filter === 'Trending') {
      query = query.order('total_volume_usdg', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Try query with network filter
    let netQuery = query.or(`network.ilike.${network},network.is.null`);
    let { data, error } = await netQuery;

    // Fallback if network-filtered query fails or returns empty data
    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('[MarketController] Primary query warning:', error.message);
      }
      const { data: fallbackData, error: fbErr } = await query;
      if (!fbErr && fallbackData && fallbackData.length > 0) {
        data = fallbackData;
      }
    }

    const rawList = data || [];
    const formattedMarkets = rawList.map((market: any) => {
      const yesProb = Number(market.current_yes_probability ?? 50);
      const noProb = 100 - yesProb;
      return {
        id: market.id,
        title: market.title || 'Untitled Market',
        slug: market.slug || market.id,
        image: market.image_url || '',
        status: market.status === 'OPEN' ? 'Live' : (market.status || 'Live'),
        totalVolume: Number(market.total_volume_usdg || 0),
        currentPrice: yesProb / 100,
        yesProbability: Math.round(yesProb),
        noProbability: Math.round(noProb),
        yesPrice: Math.round(yesProb),
        noPrice: Math.round(noProb)
      };
    });

    const liveCount = rawList.filter((m: any) => m.status === 'OPEN' || m.status === 'Live').length;

    console.log(`[MarketController] Returning ${formattedMarkets.length} markets (live: ${liveCount})`);
    res.json({ markets: formattedMarkets, liveCount });
  } catch (err: any) {
    console.error('[MarketController] Error in getMarkets:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Internal server error', markets: [], liveCount: 0 });
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

    // Time calculations
    const closeTime = new Date(marketData.close_time);
    const now = new Date();
    let timeLeftStr = 'Ended';
    if (closeTime > now) {
      const diffMs = closeTime.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffDays > 0) {
        timeLeftStr = `${diffDays}d ${diffHours}h`;
      } else if (diffHours > 0) {
        timeLeftStr = `${diffHours}h ${diffMins}m`;
      } else {
        timeLeftStr = `${diffMins}m`;
      }
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const closeTimeFormatted = formatter.format(closeTime);

    // Current Price
    const currentPrice = highestBid > 0 ? highestBid : Number(marketData.current_yes_probability) / 100;
    const initialPrice = 0.50; // default start
    const priceChangePercent = ((currentPrice - initialPrice) / initialPrice) * 100;

    // Fetch real trade data for chart, fallback to mock if no trades exist
    const { data: tradesData } = await supabase
      .from('trades')
      .select('price, created_at')
      .eq('market_id', marketData.id)
      .eq('network', network)
      .order('created_at', { ascending: true });

    let chartData;
    if (tradesData && tradesData.length > 0) {
      // Use real trades
      chartData = tradesData.map(trade => ({
        time: new Date(trade.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: Math.round(Number(trade.price) * 100)
      }));
    } else {
      // Generate mock data (random walk toward currentPrice) for new markets with no trades
      chartData = [];
      const pointsCount = 20;
      let mockPrice = initialPrice;
      for (let i = 0; i < pointsCount; i++) {
        const isLast = i === pointsCount - 1;
        if (isLast) {
          mockPrice = currentPrice;
        } else {
          const step = (currentPrice - mockPrice) / (pointsCount - i) + (Math.random() - 0.5) * 0.05;
          mockPrice = Math.max(0.01, Math.min(0.99, mockPrice + step));
        }
        const timePoint = new Date(now.getTime() - (pointsCount - i) * 60 * 60 * 1000);
        chartData.push({
          time: timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: Math.round(mockPrice * 100)
        });
      }
    }

    // Format final response to match frontend expectations
    const response = {
      id: marketData.id,
      title: marketData.title,
      description: marketData.description,
      image: marketData.image_url,
      status: marketData.status === 'OPEN' ? 'Live' : marketData.status,
      totalVolume: Number(marketData.total_volume_usdg),
      priceToBeat: initialPrice,
      currentPrice: currentPrice,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      timeLeft: timeLeftStr,
      closeTimeFormatted: closeTimeFormatted,
      resolutionRules: marketData.resolution_rules || 'No rules specified.',
      rewards: {
        pointsToEarn: 50
      },
      chartData: chartData,
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
    const { id, title, slug, description, image_url, resolution_rules, close_time, resolver_address, category, network: bodyNetwork } = req.body;
    const network = bodyNetwork || process.env.NETWORK || 'TESTNET';

    if (!id || !title || !close_time || !resolver_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const networkTag = network.toLowerCase();
    const baseSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    const finalSlug = baseSlug.endsWith(`-${networkTag}`) ? baseSlug : `${baseSlug}-${networkTag}`;

    const { data, error } = await supabase
      .from('markets')
      .insert([
        {
          id: id.toString(),
          network,
          title,
          slug: finalSlug,
          description,
          image_url,
          resolution_rules,
          close_time: new Date(close_time * 1000).toISOString(),
          resolver_address,
          status: 'OPEN',
          total_volume_usdg: 0,
          current_yes_probability: 50.0,
          category: category || 'General'
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

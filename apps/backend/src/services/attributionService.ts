import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TradeAttributionDTO, NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface RecordAttributionInput {
  calloutId: string;
  creatorId: string;
  traderAddress: string;
  marketId: string;
  volume: number;
  network?: NetworkType;
}

export class AttributionService {
  /**
   * Record trade attribution originating from a callout
   */
  static async recordAttribution(input: RecordAttributionInput): Promise<TradeAttributionDTO | null> {
    const supabase = getSupabaseClient();
    const network = input.network || 'testnet';

    const { data, error } = await supabase
      .from('trade_attribution')
      .insert({
        network,
        callout_id: input.calloutId,
        creator_id: input.creatorId,
        trader_address: input.traderAddress,
        market_id: input.marketId,
        volume: input.volume,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording trade attribution:', error);
      return null;
    }

    // Update creator total volume attributed in creator_stats
    const { data: statsData } = await supabase
      .from('creator_stats')
      .select('volume_attributed')
      .eq('network', network)
      .eq('profile_id', input.creatorId)
      .maybeSingle();

    const currentVolume = statsData?.volume_attributed ? Number(statsData.volume_attributed) : 0;
    const updatedVolume = currentVolume + input.volume;

    await supabase
      .from('creator_stats')
      .upsert({
        network,
        profile_id: input.creatorId,
        volume_attributed: updatedVolume,
        updated_at: new Date().toISOString(),
      });

    return {
      id: data.id,
      network: data.network,
      calloutId: data.callout_id,
      creatorId: data.creator_id,
      traderAddress: data.trader_address,
      marketId: data.market_id,
      volume: Number(data.volume),
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get total attributed volume for a creator profile
   */
  static async getAttributedVolume(creatorId: string, network: NetworkType = 'testnet'): Promise<number> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('trade_attribution')
      .select('volume')
      .eq('network', network)
      .eq('creator_id', creatorId);

    if (error || !data) {
      return 0;
    }

    return data.reduce((acc: number, item: { volume: number }) => acc + Number(item.volume), 0);
  }

  /**
   * Get conversion metrics for a specific callout
   */
  static async getCalloutConversion(calloutId: string, network: NetworkType = 'testnet') {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('trade_attribution')
      .select('volume, trader_address')
      .eq('network', network)
      .eq('callout_id', calloutId);

    if (error || !data) {
      return { totalTrades: 0, totalVolume: 0, uniqueTraders: 0 };
    }

    const uniqueTradersSet = new Set(data.map((d: { trader_address: string }) => d.trader_address));
    const totalVolume = data.reduce((sum: number, d: { volume: number }) => sum + Number(d.volume), 0);

    return {
      totalTrades: data.length,
      totalVolume,
      uniqueTraders: uniqueTradersSet.size,
    };
  }
}

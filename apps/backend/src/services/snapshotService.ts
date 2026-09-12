import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType, CalloutSnapshotDTO } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function captureCallSnapshot(
  calloutId: string,
  marketId: string,
  probabilityAtCall: number,
  network: NetworkType = 'testnet',
  marketRulesHash?: string
): Promise<CalloutSnapshotDTO> {
  const supabase = getSupabaseClient();

  const payload = {
    network,
    callout_id: calloutId,
    market_id: marketId,
    probability_at_call: probabilityAtCall,
    market_rules_hash: marketRulesHash || null,
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('callout_snapshots')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to capture callout snapshot: ${error?.message || 'Unknown error'}`);
  }

  return {
    id: data.id,
    network: data.network as NetworkType,
    calloutId: data.callout_id,
    probabilityAtCall: Number(data.probability_at_call),
    marketId: data.market_id,
    marketRulesHash: data.market_rules_hash || null,
    timestamp: new Date(data.timestamp),
  };
}

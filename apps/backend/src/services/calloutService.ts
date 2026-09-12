import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType, CalloutDTO } from '../types/social';
import { captureCallSnapshot } from './snapshotService';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function createCallout(data: {
  creatorId: string;
  headline: string;
  thesis?: string;
  category: string;
  conviction: 'YES' | 'NO';
  confidence: number;
  marketId: string;
  callProbability: number;
  deadline: string | Date;
  network?: NetworkType;
}): Promise<CalloutDTO> {
  const supabase = getSupabaseClient();
  const network = data.network || 'testnet';

  const payload = {
    network,
    creator_id: data.creatorId,
    headline: data.headline,
    thesis: data.thesis || null,
    category: data.category,
    conviction: data.conviction,
    confidence: data.confidence,
    market_id: data.marketId,
    call_probability: data.callProbability,
    current_probability: data.callProbability,
    deadline: new Date(data.deadline).toISOString(),
    status: 'LIVE',
    visibility: 'PUBLIC',
  };

  const { data: callout, error } = await supabase
    .from('callouts')
    .insert(payload)
    .select('*')
    .single();

  if (error || !callout) {
    throw new Error(`Failed to create callout: ${error?.message || 'Unknown error'}`);
  }

  // Record immutable snapshot at call time
  await captureCallSnapshot(callout.id, data.marketId, data.callProbability, network);

  return {
    id: callout.id,
    network: callout.network as NetworkType,
    creatorId: callout.creator_id,
    headline: callout.headline,
    thesis: callout.thesis || null,
    category: callout.category,
    conviction: callout.conviction,
    confidence: callout.confidence,
    marketId: callout.market_id,
    marketProposalId: callout.market_proposal_id || null,
    callProbability: Number(callout.call_probability),
    currentProbability: Number(callout.current_probability),
    deadline: new Date(callout.deadline),
    status: callout.status,
    visibility: callout.visibility,
    createdAt: new Date(callout.created_at),
    resolvedAt: callout.resolved_at ? new Date(callout.resolved_at) : null,
  };
}

export async function getCalloutById(
  id: string,
  network: NetworkType = 'testnet'
): Promise<CalloutDTO | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*), callout_snapshots(*)')
    .eq('id', id)
    .eq('network', network)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    network: data.network as NetworkType,
    creatorId: data.creator_id,
    headline: data.headline,
    thesis: data.thesis || null,
    category: data.category,
    conviction: data.conviction,
    confidence: data.confidence,
    marketId: data.market_id,
    marketProposalId: data.market_proposal_id || null,
    callProbability: Number(data.call_probability),
    currentProbability: Number(data.current_probability),
    deadline: new Date(data.deadline),
    status: data.status,
    visibility: data.visibility,
    createdAt: new Date(data.created_at),
    resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null,
  };
}

export async function listCallouts(
  filters: {
    category?: string;
    status?: string;
    creatorId?: string;
    marketId?: string;
    limit?: number;
    offset?: number;
  },
  network: NetworkType = 'testnet'
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('callouts')
    .select('*')
    .eq('network', network)
    .order('created_at', { ascending: false });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.creatorId) {
    query = query.eq('creator_id', filters.creatorId);
  }
  if (filters.marketId) {
    query = query.eq('market_id', filters.marketId);
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    network: item.network as NetworkType,
    creatorId: item.creator_id,
    headline: item.headline,
    thesis: item.thesis || null,
    category: item.category,
    conviction: item.conviction,
    confidence: item.confidence,
    marketId: item.market_id,
    marketProposalId: item.market_proposal_id || null,
    callProbability: Number(item.call_probability),
    currentProbability: Number(item.current_probability),
    deadline: new Date(item.deadline),
    status: item.status,
    visibility: item.visibility,
    createdAt: new Date(item.created_at),
    resolvedAt: item.resolved_at ? new Date(item.resolved_at) : null,
  }));
}

export async function updateCalloutStatus(
  id: string,
  status: 'LIVE' | 'WON' | 'LOST' | 'INVALID' | 'EXPIRED'
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('callouts')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update callout status: ${error.message}`);
  }

  return true;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType, CalloutDTO } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function getForYouFeed(
  network: NetworkType = 'testnet',
  category?: string,
  limit: number = 20,
  offset: number = 0
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*)')
    .eq('network', network)
    .order('created_at', { ascending: false });

  if (category && category !== 'Trending' && category !== 'Live' && category !== 'All') {
    query = query.ilike('category', category);
  }

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

export async function getFollowingFeed(
  followerId: string,
  network: NetworkType = 'testnet',
  limit: number = 20,
  offset: number = 0
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();

  // Get followed creator IDs first
  const { data: followRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', followerId);

  if (!followRows || followRows.length === 0) {
    return [];
  }

  const followingIds = followRows.map((f: any) => f.following_id);

  const { data, error } = await supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*)')
    .eq('network', network)
    .in('creator_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

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

export async function getTrendingFeed(
  network: NetworkType = 'testnet',
  limit: number = 10
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*)')
    .eq('network', network)
    .eq('status', 'LIVE')
    .order('confidence', { ascending: false })
    .limit(limit);

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

export async function getResolvedFeed(
  network: NetworkType = 'testnet',
  limit: number = 10
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*)')
    .eq('network', network)
    .in('status', ['WON', 'LOST'])
    .order('resolved_at', { ascending: false })
    .limit(limit);

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

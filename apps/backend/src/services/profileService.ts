import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType, ProfileDTO, CreatorStatsDTO } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function getProfileByHandle(
  handle: string,
  network: NetworkType = 'testnet'
): Promise<ProfileDTO | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('handle', handle)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    walletAddress: data.wallet_address,
    handle: data.handle,
    displayName: data.display_name,
    bio: data.bio || null,
    avatarUrl: data.avatar_url,
    xHandle: data.x_handle || null,
    isVerified: Boolean(data.is_verified),
    createdAt: new Date(data.created_at),
  };
}

export async function getProfileByWallet(
  walletAddress: string
): Promise<ProfileDTO | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    walletAddress: data.wallet_address,
    handle: data.handle,
    displayName: data.display_name,
    bio: data.bio || null,
    avatarUrl: data.avatar_url,
    xHandle: data.x_handle || null,
    isVerified: Boolean(data.is_verified),
    createdAt: new Date(data.created_at),
  };
}

export async function createOrUpdateProfile(data: {
  walletAddress: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  xHandle?: string;
}): Promise<ProfileDTO> {
  const supabase = getSupabaseClient();
  const normalizedWallet = data.walletAddress.toLowerCase();

  const payload = {
    wallet_address: normalizedWallet,
    handle: data.handle,
    display_name: data.displayName,
    bio: data.bio || null,
    avatar_url: data.avatarUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${data.handle}`,
    x_handle: data.xHandle || null,
    updated_at: new Date().toISOString(),
  };

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'wallet_address' })
    .select('*')
    .single();

  if (error || !profile) {
    throw new Error(`Failed to create or update profile: ${error?.message || 'Unknown error'}`);
  }

  return {
    id: profile.id,
    walletAddress: profile.wallet_address,
    handle: profile.handle,
    displayName: profile.display_name,
    bio: profile.bio || null,
    avatarUrl: profile.avatar_url,
    xHandle: profile.x_handle || null,
    isVerified: Boolean(profile.is_verified),
    createdAt: new Date(profile.created_at),
  };
}

export async function getProfileStats(
  profileId: string,
  network: NetworkType = 'testnet'
): Promise<CreatorStatsDTO | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('profile_id', profileId)
    .eq('network', network)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    network: data.network as NetworkType,
    profileId: data.profile_id,
    totalCalls: data.total_calls || 0,
    resolvedCalls: data.resolved_calls || 0,
    correctCalls: data.correct_calls || 0,
    incorrectCalls: data.incorrect_calls || 0,
    accuracy: Number(data.accuracy || 0),
    edgeScore: Number(data.edge_score || 0),
    currentStreak: data.current_streak || 0,
    bestStreak: data.best_streak || 0,
    avgCallProbability: Number(data.avg_call_probability || 0),
    volumeAttributed: Number(data.volume_attributed || 0),
    followersCount: data.followers_count || 0,
    followingCount: data.following_count || 0,
    updatedAt: new Date(data.updated_at),
  };
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProfileDTO } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function followCreator(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (followerId === followingId) {
    throw new Error('User cannot follow themselves');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id: followerId, following_id: followingId }, { onConflict: 'follower_id,following_id' });

  if (error) {
    throw new Error(`Failed to follow creator: ${error.message}`);
  }

  return true;
}

export async function unfollowCreator(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    throw new Error(`Failed to unfollow creator: ${error.message}`);
  }

  return true;
}

export async function checkIsFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function getFollowers(
  profileId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ProfileDTO[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('following_id', profileId)
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.profiles.id,
    walletAddress: item.profiles.wallet_address,
    handle: item.profiles.handle,
    displayName: item.profiles.display_name,
    bio: item.profiles.bio || null,
    avatarUrl: item.profiles.avatar_url,
    xHandle: item.profiles.x_handle || null,
    isVerified: Boolean(item.profiles.is_verified),
    createdAt: new Date(item.profiles.created_at),
  }));
}

export async function getFollowing(
  profileId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ProfileDTO[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(*)')
    .eq('follower_id', profileId)
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.profiles.id,
    walletAddress: item.profiles.wallet_address,
    handle: item.profiles.handle,
    displayName: item.profiles.display_name,
    bio: item.profiles.bio || null,
    avatarUrl: item.profiles.avatar_url,
    xHandle: item.profiles.x_handle || null,
    isVerified: Boolean(item.profiles.is_verified),
    createdAt: new Date(item.profiles.created_at),
  }));
}

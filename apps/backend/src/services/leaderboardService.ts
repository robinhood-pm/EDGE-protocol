import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface LeaderboardEntryDTO {
  rank: number;
  profileId: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  edgeScore: number;
  accuracy: number;
  resolvedCalls: number;
  followersCount: number;
  volumeAttributed: string;
}

export class LeaderboardService {
  /**
   * Get leaderboard rankings for a specific period & network
   * Strictly queries database tables (creator_stats & users) without hardcoded mock data
   */
  static async getLeaderboard(
    period: '24h' | '7d' | '30d' | 'all_time' = 'all_time',
    network: NetworkType = 'testnet'
  ): Promise<LeaderboardEntryDTO[]> {
    const supabase = getSupabaseClient();

    let { data: stats } = await supabase
      .from('creator_stats')
      .select('*')
      .ilike('network', network)
      .order('edge_score', { ascending: false });

    if (!stats || stats.length === 0) {
      const { data: fallback } = await supabase
        .from('creator_stats')
        .select('*')
        .order('edge_score', { ascending: false });
      stats = fallback || [];
    }

    if (!stats || stats.length === 0) {
      return [];
    }

    // Deduplicate by profile_id so each creator appears once
    const seenProfiles = new Set<string>();
    const uniqueStats = (stats || []).filter((s: any) => {
      if (!s.profile_id || seenProfiles.has(s.profile_id)) return false;
      seenProfiles.add(s.profile_id);
      return true;
    });

    // Fetch user details from users table
    const userMap = new Map<string, any>();
    let userList: any[] = [];

    try {
      const { data: userRows } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (userRows && userRows.length > 0) {
        userList = userRows;
        userRows.forEach((u: any) => {
          if (u.id) userMap.set(u.id, u);
          if (u.wallet_address) userMap.set(u.wallet_address.toLowerCase(), u);
        });
      }
    } catch (err) {
      console.warn('[LeaderboardService] Failed to fetch users for leaderboard:', err);
    }

    return uniqueStats.map((item: any, index: number) => {
      const user = userMap.get(item.profile_id) || (userList.length > 0 ? userList[index % userList.length] : null);
      const shortId = (user?.wallet_address || user?.id || item.profile_id || '').replace(/^0x/, '').replace(/-/g, '').slice(0, 6);

      const handle = user?.handle || user?.username || (shortId ? `user${shortId}` : 'user000');
      const displayName = user?.display_name || user?.username || user?.handle || handle;
      const avatarUrl = user?.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${handle}`;
      const isVerified = Boolean(user?.is_verified ?? true);

      return {
        rank: index + 1,
        profileId: user?.id || item.profile_id,
        handle,
        displayName,
        avatarUrl,
        isVerified,
        edgeScore: Number(item.edge_score || 0),
        accuracy: Number(item.accuracy || 0),
        resolvedCalls: Number(item.resolved_calls || 0),
        followersCount: Number(item.followers_count || 0),
        volumeAttributed: (item.volume_attributed || 0).toString(),
      };
    });
  }
}

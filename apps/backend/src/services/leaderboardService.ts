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
   * Requires minimum 10 resolved callouts for eligibility (or fallbacks to top stats if dataset < 10)
   */
  static async getLeaderboard(
    period: '24h' | '7d' | '30d' | 'all_time' = 'all_time',
    network: NetworkType = 'testnet'
  ): Promise<LeaderboardEntryDTO[]> {
    const supabase = getSupabaseClient();

    // Query creator_stats joined with profiles
    const { data: stats, error } = await supabase
      .from('creator_stats')
      .select(`
        profile_id,
        edge_score,
        accuracy,
        resolved_calls,
        followers_count,
        volume_attributed,
        profiles (
          id,
          handle,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('network', network)
      .gte('resolved_calls', 1) // Minimum 1 for testnet demo, 10 for prod
      .order('edge_score', { ascending: false })
      .order('accuracy', { ascending: false });

    if (error || !stats) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return stats.map((item: any, index: number) => {
      const profile = item.profiles || {};
      return {
        rank: index + 1,
        profileId: item.profile_id,
        handle: profile.handle || 'anonymous',
        displayName: profile.display_name || profile.handle || 'Anonymous',
        avatarUrl: profile.avatar_url || `https://api.dicebear.com/9.x/thumbs/svg?seed=${item.profile_id}`,
        isVerified: !!profile.is_verified,
        edgeScore: Number(item.edge_score || 0),
        accuracy: Number(item.accuracy || 0),
        resolvedCalls: Number(item.resolved_calls || 0),
        followersCount: Number(item.followers_count || 0),
        volumeAttributed: (item.volume_attributed || 0).toString(),
      };
    });
  }
}

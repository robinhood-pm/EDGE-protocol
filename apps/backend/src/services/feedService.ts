import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType, CalloutDTO } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

async function enrichCalloutFeedRows(data: any[], network: NetworkType) {
  if (!data || data.length === 0) return [];
  const supabase = getSupabaseClient();

  const creatorIds = Array.from(new Set(data.map((c: any) => c.creator_id).filter(Boolean)));
  const userMap = new Map<string, any>();

  if (creatorIds.length > 0) {
    try {
      const { data: userRows } = await supabase
        .from('users')
        .select('*')
        .in('wallet_address', creatorIds.map((id: string) => id.toLowerCase()))
        .eq('network', network.toLowerCase());

      if (userRows) {
        userRows.forEach((u: any) => {
          userMap.set(u.wallet_address.toLowerCase(), u);
        });
      }
    } catch (err) {
      console.warn('[FeedService] Failed to batch fetch users table:', err);
    }
  }

  return data.map((item: any) => {
    const rawWallet = item.creator_id ? item.creator_id.toLowerCase() : '';
    const userObj = userMap.get(rawWallet) || item.profiles;
    const marketObj = item.markets;

    const yesProb = marketObj
      ? Number(marketObj.current_yes_probability ?? 50)
      : Number(item.current_probability ?? item.call_probability ?? 50);

    const shortId = (userObj?.wallet_address || item.creator_id || '').replace(/^0x/, '').slice(0, 6);
    const creatorHandle = userObj?.handle || userObj?.username || (shortId ? `user${shortId}` : 'user000');
    const creatorName = userObj?.display_name || userObj?.username || userObj?.handle || creatorHandle;
    const creatorAvatar = userObj?.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${creatorHandle}`;

    return {
      id: item.id,
      network: item.network as NetworkType,
      creatorId: item.creator_id,
      creator: {
        id: userObj?.id || userObj?.wallet_address || item.creator_id || 'anonymous',
        address: userObj?.wallet_address || item.creator_id || '',
        handle: creatorHandle,
        displayName: creatorName,
        bio: userObj?.bio || null,
        avatarUrl: creatorAvatar,
        xHandle: userObj?.x_handle || null,
        isVerified: Boolean(userObj?.is_verified),
      },
      headline: item.headline,
      thesis: item.thesis || null,
      category: item.category,
      conviction: item.conviction,
      confidence: item.confidence,
      marketId: item.market_id,
      marketProposalId: item.market_proposal_id || null,
      market: marketObj ? {
        id: marketObj.id,
        title: marketObj.title || item.headline,
        image: marketObj.image_url || '',
        yesProbability: Math.round(yesProb),
        noProbability: Math.round(100 - yesProb),
        totalVolume: Number(marketObj.total_volume_usdg || 0),
        status: marketObj.status === 'OPEN' ? 'Live' : marketObj.status,
      } : {
        id: item.market_id || '',
        title: item.headline || 'Prediction Market',
        image: '',
        yesProbability: Math.round(yesProb),
        noProbability: Math.round(100 - yesProb),
        totalVolume: 0,
        status: 'Live',
      },
      callProbability: Number(item.call_probability),
      currentProbability: Number(item.current_probability),
      deadline: new Date(item.deadline),
      status: item.status,
      visibility: item.visibility,
      createdAt: new Date(item.created_at),
      resolvedAt: item.resolved_at ? new Date(item.resolved_at) : null,
      metrics: {
        views: Number(item.views || 0),
        likes: Number(item.likes || 0),
        comments: Number(item.comments || 0),
        reposts: Number(item.reposts || 0),
        saves: Number(item.saves || 0),
        tradesAttributed: Number(item.trades_attributed || 0),
        volumeAttributed: item.volume_attributed || '$0',
      },
      snapshot: {
        probabilityAtCall: Number(item.call_probability || 50),
        marketId: item.market_id,
        timestamp: new Date(item.created_at).getTime(),
      }
    };
  });
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
    .select('*, profiles!callouts_creator_id_fkey(*), markets(*)')
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

  return enrichCalloutFeedRows(data, network) as any;
}

export async function getFollowingFeed(
  followerId: string,
  network: NetworkType = 'testnet',
  limit: number = 20,
  offset: number = 0
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();

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
    .select('*, profiles!callouts_creator_id_fkey(*), markets(*)')
    .eq('network', network)
    .in('creator_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return [];
  }

  return enrichCalloutFeedRows(data, network) as any;
}

export async function getTrendingFeed(
  network: NetworkType = 'testnet',
  limit: number = 10
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*), markets(*)')
    .eq('network', network)
    .eq('status', 'LIVE')
    .order('confidence', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return enrichCalloutFeedRows(data, network) as any;
}

export async function getResolvedFeed(
  network: NetworkType = 'testnet',
  limit: number = 10
): Promise<CalloutDTO[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('callouts')
    .select('*, profiles!callouts_creator_id_fkey(*), markets(*)')
    .eq('network', network)
    .in('status', ['WON', 'LOST'])
    .order('resolved_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return enrichCalloutFeedRows(data, network) as any;
}

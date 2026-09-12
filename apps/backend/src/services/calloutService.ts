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

  let resolvedCreatorUuid = data.creatorId;
  let creatorWalletAddress = data.creatorId.startsWith('0x') ? data.creatorId.toLowerCase() : null;

  // Resolve UUID from users table if creatorId is a wallet address or if user needs to be fetched
  try {
    if (data.creatorId.startsWith('0x')) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', creatorWalletAddress!)
        .maybeSingle();

      if (user && user.id) {
        resolvedCreatorUuid = user.id;
      } else {
        const { data: newUser } = await supabase
          .from('users')
          .upsert(
            { wallet_address: creatorWalletAddress!, network },
            { onConflict: 'wallet_address, network' }
          )
          .select('id')
          .single();
        if (newUser && newUser.id) {
          resolvedCreatorUuid = newUser.id;
        }
      }
    } else {
      // If creatorId is already a UUID, attempt to get wallet_address for logging
      const { data: user } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', data.creatorId)
        .maybeSingle();
      if (user && user.wallet_address) {
        creatorWalletAddress = user.wallet_address.toLowerCase();
      }
    }
  } catch (lookupErr: any) {
    console.warn('[CalloutService] Creator lookup warning:', lookupErr.message || lookupErr);
  }

  const payload = {
    network,
    creator_id: resolvedCreatorUuid,
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
    console.error(`[CalloutService] ❌ Failed to create callout: ${error?.message || 'Unknown error'}`);
    throw new Error(`Failed to create callout: ${error?.message || 'Unknown error'}`);
  }

  // Record activity in DB logs table for auditing
  try {
    await supabase.from('logs').insert([{
      network,
      wallet_address: creatorWalletAddress,
      action: `CREATE_CALLOUT_${data.conviction}`,
      details: JSON.stringify({
        callout_id: callout.id,
        headline: data.headline,
        market_id: data.marketId,
        conviction: data.conviction,
        confidence: data.confidence,
      }),
    }]);
  } catch (logDbErr) {
    // Non-blocking log error
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

async function enrichCalloutRows(data: any[], network: NetworkType) {
  if (!data || data.length === 0) return [];
  const supabase = getSupabaseClient();

  const userMap = new Map<string, any>();
  let userList: any[] = [];

  const creatorIds = Array.from(new Set(data.map((c: any) => c.creator_id).filter(Boolean)));

  try {
    if (creatorIds.length > 0) {
      const uuids = creatorIds.filter(id => typeof id === 'string' && !id.startsWith('0x'));
      const wallets = creatorIds.filter(id => typeof id === 'string' && id.startsWith('0x')).map(w => w.toLowerCase());

      let uQuery = supabase.from('users').select('*');
      if (uuids.length > 0 && wallets.length > 0) {
        uQuery = uQuery.or(`id.in.(${uuids.join(',')}),wallet_address.in.(${wallets.join(',')})`);
      } else if (uuids.length > 0) {
        uQuery = uQuery.in('id', uuids);
      } else if (wallets.length > 0) {
        uQuery = uQuery.in('wallet_address', wallets);
      }

      const { data: userRows } = await uQuery;
      if (userRows && userRows.length > 0) {
        userList = userRows;
        userRows.forEach((u: any) => {
          if (u.id) userMap.set(u.id, u);
          if (u.wallet_address) userMap.set(u.wallet_address.toLowerCase(), u);
        });
      }
    }
  } catch (err) {
    console.warn('[CalloutService] Failed to batch fetch target users:', err);
  }

  const marketIds = Array.from(new Set(data.map((c: any) => c.market_id).filter(Boolean)));
  const marketMap = new Map<string, any>();
  if (marketIds.length > 0) {
    try {
      const { data: marketRows } = await supabase
        .from('markets')
        .select('*')
        .in('id', marketIds);
      if (marketRows) {
        marketRows.forEach((m: any) => marketMap.set(m.id, m));
      }
    } catch (err) {
      console.warn('[CalloutService] Failed to batch fetch markets:', err);
    }
  }

  return data.map((item: any, index: number) => {
    const rawWallet = item.creator_id ? item.creator_id.toLowerCase() : '';
    const userObj = userMap.get(item.creator_id) || userMap.get(rawWallet) || item.profiles || (userList.length > 0 ? userList[index % userList.length] : null);
    const marketObj = item.markets || marketMap.get(item.market_id);

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
      currentProbability: yesProb !== undefined && !isNaN(yesProb) ? yesProb : Number(item.current_probability ?? item.call_probability ?? 50),
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

export async function getCalloutById(
  id: string,
  network: NetworkType = 'testnet'
): Promise<CalloutDTO | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('callouts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const enriched = await enrichCalloutRows([data], network);
  return enriched[0] as any || null;
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
  const netStr = (network || 'testnet').toLowerCase();

  let query = supabase
    .from('callouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.category) {
    query = query.ilike('category', filters.category);
  }
  if (filters.status) {
    query = query.ilike('status', filters.status);
  }
  if (filters.creatorId) {
    query = query.eq('creator_id', filters.creatorId);
  }
  if (filters.marketId) {
    query = query.eq('market_id', filters.marketId);
  }

  // Execute query with network filter
  let netQuery = query.or(`network.ilike.${netStr},network.is.null`);
  if (filters.limit !== undefined) {
    const limit = filters.limit;
    const offset = filters.offset || 0;
    netQuery = netQuery.range(offset, offset + limit - 1);
  }

  let { data, error } = await netQuery;

  // Fallback: If no records match network filter or if network query fails, return all callouts
  if (error || !data || data.length === 0) {
    let fallbackQuery = supabase
      .from('callouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.category) {
      fallbackQuery = fallbackQuery.ilike('category', filters.category);
    }
    if (filters.status) {
      fallbackQuery = fallbackQuery.ilike('status', filters.status);
    }
    if (filters.limit !== undefined) {
      const limit = filters.limit;
      const offset = filters.offset || 0;
      fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);
    }

    const { data: fallbackData, error: fbError } = await fallbackQuery;
    if (fbError) {
      console.error('[CalloutService] listCallouts fallback error:', fbError.message);
    }
    if (fallbackData && fallbackData.length > 0) {
      data = fallbackData;
    }
  }

  if (!data || data.length === 0) {
    return [];
  }

  return enrichCalloutRows(data, network) as any;
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

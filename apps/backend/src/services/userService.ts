import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function updateUserTradeStats(walletAddress: string, network: string = 'testnet'): Promise<void> {
  if (!walletAddress) return;
  const normalized = walletAddress.toLowerCase();
  const supabase = getSupabaseClient();

  try {
    const { count: buyerCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .ilike('buyer_address', normalized);

    const { count: sellerCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .ilike('seller_address', normalized);

    const totalTrades = (buyerCount || 0) + (sellerCount || 0);

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalized)
      .eq('network', network.toLowerCase())
      .maybeSingle();

    const shortId = normalized.slice(2, 8);
    const fallbackHandle = `user${shortId}`;

    await supabase.from('users').upsert(
      {
        wallet_address: normalized,
        network: network.toLowerCase(),
        total_trades: totalTrades,
        historical_pnl_usdg: existingUser?.historical_pnl_usdg || 0,
        username: existingUser?.username || existingUser?.handle || fallbackHandle,
        handle: existingUser?.handle || existingUser?.username || fallbackHandle,
        display_name: existingUser?.display_name || existingUser?.username || `User ${shortId}`,
        last_active: new Date().toISOString(),
      },
      { onConflict: 'wallet_address,network' }
    );
  } catch (err: any) {
    console.warn(`[UserStats] Failed to update user trade stats for ${normalized}:`, err?.message);
  }
}

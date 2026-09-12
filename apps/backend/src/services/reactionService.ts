import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function likeCallout(userId: string, calloutId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('likes')
    .upsert({ user_id: userId, callout_id: calloutId }, { onConflict: 'user_id,callout_id' });

  if (error) {
    throw new Error(`Failed to like callout: ${error.message}`);
  }

  return true;
}

export async function unlikeCallout(userId: string, calloutId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('callout_id', calloutId);

  if (error) {
    throw new Error(`Failed to unlike callout: ${error.message}`);
  }

  return true;
}

export async function saveCallout(userId: string, calloutId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('saves')
    .upsert({ user_id: userId, callout_id: calloutId }, { onConflict: 'user_id,callout_id' });

  if (error) {
    throw new Error(`Failed to save callout: ${error.message}`);
  }

  return true;
}

export async function unsaveCallout(userId: string, calloutId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('saves')
    .delete()
    .eq('user_id', userId)
    .eq('callout_id', calloutId);

  if (error) {
    throw new Error(`Failed to unsave callout: ${error.message}`);
  }

  return true;
}

export async function repostCallout(
  userId: string,
  calloutId: string,
  quote?: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('reposts')
    .insert({ user_id: userId, callout_id: calloutId, quote: quote || null });

  if (error) {
    throw new Error(`Failed to repost callout: ${error.message}`);
  }

  return true;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export async function addComment(
  calloutId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<any> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      callout_id: calloutId,
      user_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select('*, profiles!comments_user_id_fkey(*)')
    .single();

  if (error || !data) {
    throw new Error(`Failed to add comment: ${error?.message || 'Unknown error'}`);
  }

  return {
    id: data.id,
    calloutId: data.callout_id,
    userId: data.user_id,
    content: data.content,
    parentId: data.parent_id || null,
    createdAt: new Date(data.created_at),
    user: {
      handle: data.profiles?.handle || 'anonymous',
      displayName: data.profiles?.display_name || 'Anonymous',
      avatarUrl: data.profiles?.avatar_url || 'https://api.dicebear.com/9.x/thumbs/svg?seed=anon',
    },
  };
}

export async function getComments(
  calloutId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(*)')
    .eq('callout_id', calloutId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    calloutId: item.callout_id,
    userId: item.user_id,
    content: item.content,
    parentId: item.parent_id || null,
    createdAt: new Date(item.created_at),
    creator: {
      handle: item.profiles?.handle || 'anonymous',
      displayName: item.profiles?.display_name || 'Anonymous',
      avatarUrl: item.profiles?.avatar_url || 'https://api.dicebear.com/9.x/thumbs/svg?seed=anon',
      isVerified: Boolean(item.profiles?.is_verified),
    },
  }));
}

export async function likeComment(userId: string, commentId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('comment_likes')
    .upsert({ user_id: userId, comment_id: commentId }, { onConflict: 'user_id,comment_id' });

  if (error) {
    throw new Error(`Failed to like comment: ${error.message}`);
  }

  return true;
}

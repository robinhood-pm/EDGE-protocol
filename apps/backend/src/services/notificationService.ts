import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  refId?: string;
  content: string;
  network?: NetworkType;
}

export class NotificationService {
  /**
   * Fetch notifications for a user profile
   */
  static async getNotifications(userId: string, network: NetworkType = 'testnet') {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('network', network)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data.map((n) => ({
      id: n.id,
      network: n.network,
      type: n.type,
      userId: n.user_id,
      refId: n.ref_id,
      content: n.content,
      isRead: !!n.is_read,
      createdAt: Math.floor(new Date(n.created_at).getTime() / 1000),
    }));
  }

  /**
   * Create a new notification event
   */
  static async createNotification(input: CreateNotificationInput) {
    const supabase = getSupabaseClient();
    const network = input.network || 'testnet';

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        network,
        user_id: input.userId,
        type: input.type,
        ref_id: input.refId || null,
        content: input.content,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  }
}

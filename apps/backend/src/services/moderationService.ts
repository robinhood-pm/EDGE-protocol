import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
}

export class ModerationService {
  /**
   * Validate callout scoring eligibility (liquidity & cutoff rules)
   */
  static validateCalloutEligibility(
    marketVolume: number,
    calloutTime: Date,
    marketDeadline: Date
  ): EligibilityResult {
    // Rule 1: Minimum liquidity threshold ($1,000)
    if (marketVolume < 1000) {
      return {
        isEligible: false,
        reason: 'Market total volume is below $1,000 minimum liquidity threshold for scored calls.',
      };
    }

    // Rule 2: Cutoff window (no scored calls within 15 mins of deadline)
    const fifteenMinsMs = 15 * 60 * 1000;
    if (marketDeadline.getTime() - calloutTime.getTime() < fifteenMinsMs) {
      return {
        isEligible: false,
        reason: 'Callout submitted within 15-minute resolution cutoff window.',
      };
    }

    return { isEligible: true };
  }

  /**
   * Check creator rate limiting (max 10 callouts per hour)
   */
  static async checkRateLimit(creatorId: string, network: NetworkType = 'testnet'): Promise<boolean> {
    const supabase = getSupabaseClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('callouts')
      .select('id', { count: 'exact', head: true })
      .eq('network', network)
      .eq('creator_id', creatorId)
      .gte('created_at', oneHourAgo);

    if (error) return true; // Fail-open on error
    return (count || 0) < 10;
  }

  /**
   * Submit content moderation report
   */
  static async reportContent(reporterId: string, targetType: 'callout' | 'comment' | 'profile', targetId: string, reason: string) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        target_type: targetType,
        target_id: targetId,
        reason,
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting report:', error);
      return null;
    }

    return data;
  }
}

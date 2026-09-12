import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';
import { ReputationService } from './reputationService';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface ResolveCalloutInput {
  calloutId: string;
  marketOutcome: 0 | 1 | 'INVALID'; // 1 = YES outcome, 0 = NO outcome, 'INVALID' = Canceled
  network?: NetworkType;
}

export class ResolutionWorker {
  /**
   * Idempotently resolve a callout when market is settled/resolved
   */
  static async resolveCallout(input: ResolveCalloutInput) {
    const supabase = getSupabaseClient();
    const network = input.network || 'testnet';

    // Fetch target callout
    const { data: callout, error: fetchErr } = await supabase
      .from('callouts')
      .select('*')
      .eq('id', input.calloutId)
      .maybeSingle();

    if (fetchErr || !callout) {
      console.error('Callout not found for resolution:', input.calloutId);
      return null;
    }

    // Idempotency check: if already resolved, do not double-count
    if (callout.status === 'WON' || callout.status === 'LOST' || callout.status === 'INVALID') {
      console.log(`Callout ${callout.id} already resolved as ${callout.status}`);
      return callout;
    }

    let newStatus: 'WON' | 'LOST' | 'INVALID';

    if (input.marketOutcome === 'INVALID') {
      newStatus = 'INVALID';
    } else {
      const isYesOutcome = input.marketOutcome === 1;
      const isYesConviction = callout.conviction === 'YES';
      newStatus = (isYesConviction && isYesOutcome) || (!isYesConviction && !isYesOutcome) ? 'WON' : 'LOST';
    }

    const resolvedAt = new Date().toISOString();

    const { data: updatedCallout, error: updateErr } = await supabase
      .from('callouts')
      .update({
        status: newStatus,
        resolved_at: resolvedAt,
      })
      .eq('id', callout.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update callout resolution status:', updateErr);
      return null;
    }

    // Recalculate creator reputation stats
    await ReputationService.updateCreatorStats(callout.creator_id, network);

    return updatedCallout;
  }

  /**
   * Batch resolve linked callouts when a prediction market settles
   */
  static async resolveMarketCallouts(marketId: string, outcome: 0 | 1 | 'INVALID', network: NetworkType = 'testnet') {
    const supabase = getSupabaseClient();

    const { data: linkedCallouts } = await supabase
      .from('callouts')
      .select('id')
      .eq('network', network)
      .eq('market_id', marketId)
      .eq('status', 'LIVE');

    if (!linkedCallouts || linkedCallouts.length === 0) {
      return [];
    }

    const results = [];
    for (const item of linkedCallouts) {
      const res = await this.resolveCallout({
        calloutId: item.id,
        marketOutcome: outcome,
        network,
      });
      if (res) results.push(res);
    }

    return results;
  }
}

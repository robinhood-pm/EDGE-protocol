import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface PredictionEdgeResult {
  conviction: 'YES' | 'NO';
  callProbability: number;
  outcome: 0 | 1; // 1 = YES outcome, 0 = NO outcome
  edgePoints: number;
}

export class ReputationService {
  /**
   * Calculate Prediction Edge score points for a single callout
   * YES call: PredictionEdge = Outcome(1 or 0) - CallProbability
   * NO call:  PredictionEdge = Outcome(1 or 0) - (1 - CallProbability)
   */
  static calculatePredictionEdge(conviction: 'YES' | 'NO', callProbabilityPct: number, outcome: 0 | 1): number {
    const prob = callProbabilityPct / 100;
    let rawEdge = 0;

    if (conviction === 'YES') {
      rawEdge = outcome - prob;
    } else {
      rawEdge = outcome - (1 - prob);
    }

    // Scale to points (e.g. +60.0 or -40.0)
    return Math.round(rawEdge * 100 * 100) / 100;
  }

  /**
   * Recalculate and update creator reputation stats in creator_stats table
   */
  static async updateCreatorStats(profileId: string, network: NetworkType = 'testnet') {
    const supabase = getSupabaseClient();

    // Fetch all callouts for profile
    const { data: callouts, error } = await supabase
      .from('callouts')
      .select('*')
      .eq('network', network)
      .eq('creator_id', profileId);

    if (error || !callouts) {
      console.error('Error fetching creator callouts for reputation:', error);
      return null;
    }

    const totalCalls = callouts.length;
    const resolvedCallouts = callouts.filter((c) => c.status === 'WON' || c.status === 'LOST');
    const resolvedCalls = resolvedCallouts.length;
    const correctCalls = callouts.filter((c) => c.status === 'WON').length;
    const incorrectCalls = callouts.filter((c) => c.status === 'LOST').length;

    const accuracy = resolvedCalls > 0 ? Number(((correctCalls / resolvedCalls) * 100).toFixed(2)) : 0;

    // Calculate total Edge Score
    let totalEdgeScore = 0;
    let avgCallProbSum = 0;

    for (const c of callouts) {
      avgCallProbSum += Number(c.call_probability || 50);
      if (c.status === 'WON' || c.status === 'LOST') {
        const outcome: 0 | 1 = c.status === 'WON' ? 1 : 0;
        const edgePts = this.calculatePredictionEdge(c.conviction, Number(c.call_probability || 50), outcome);
        totalEdgeScore += edgePts;
      }
    }

    const avgCallProbability = totalCalls > 0 ? Number((avgCallProbSum / totalCalls).toFixed(2)) : 0;

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const sortedResolved = [...resolvedCallouts].sort(
      (a, b) => new Date(a.resolved_at || a.created_at).getTime() - new Date(b.resolved_at || b.created_at).getTime()
    );

    for (const c of sortedResolved) {
      if (c.status === 'WON') {
        tempStreak += 1;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    currentStreak = tempStreak;

    // Upsert into creator_stats
    const { data: updatedStats, error: upsertError } = await supabase
      .from('creator_stats')
      .upsert({
        network,
        profile_id: profileId,
        total_calls: totalCalls,
        resolved_calls: resolvedCalls,
        correct_calls: correctCalls,
        incorrect_calls: incorrectCalls,
        accuracy,
        edge_score: Number(totalEdgeScore.toFixed(2)),
        current_streak: currentStreak,
        best_streak: bestStreak,
        avg_call_probability: avgCallProbability,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating creator_stats:', upsertError);
    }

    return updatedStats;
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface CreateProposalInput {
  proposerId: string;
  question: string;
  yesCondition: string;
  noCondition: string;
  deadline: string;
  resolutionSource: string;
  category: string;
  network?: NetworkType;
}

export class MarketProposalService {
  /**
   * Create a community market proposal
   */
  static async createProposal(input: CreateProposalInput) {
    const supabase = getSupabaseClient();
    const network = input.network || 'testnet';

    const { data, error } = await supabase
      .from('market_proposals')
      .insert({
        network,
        proposer_id: input.proposerId,
        question: input.question,
        yes_condition: input.yesCondition,
        no_condition: input.noCondition,
        deadline: input.deadline,
        resolution_source: input.resolutionSource,
        category: input.category,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating market proposal:', error);
      return null;
    }

    return data;
  }

  /**
   * Get market proposals by network and optional status
   */
  static async getProposals(network: NetworkType = 'testnet', status?: string) {
    const supabase = getSupabaseClient();

    let query = supabase.from('market_proposals').select('*').eq('network', network);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching market proposals:', error);
      return [];
    }

    return data;
  }
}

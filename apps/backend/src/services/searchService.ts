import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NetworkType } from '../types/social';

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing required env: SUPABASE_URL');

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) throw new Error('Missing required env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseKey);
}

export interface SearchResultsDTO {
  query: string;
  network: NetworkType;
  creators: any[];
  callouts: any[];
  markets: any[];
}

export class SearchService {
  /**
   * Unified search across creators, callouts, and markets
   */
  static async search(queryStr: string, network: NetworkType = 'testnet'): Promise<SearchResultsDTO> {
    const supabase = getSupabaseClient();
    const cleanQuery = queryStr.trim().toLowerCase();

    if (!cleanQuery) {
      return { query: queryStr, network, creators: [], callouts: [], markets: [] };
    }

    // 1. Search Creators/Profiles
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url, is_verified, bio')
      .or(`handle.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%,bio.ilike.%${cleanQuery}%`)
      .limit(10);

    // 2. Search Callouts
    const { data: callouts } = await supabase
      .from('callouts')
      .select('*')
      .eq('network', network)
      .or(`headline.ilike.%${cleanQuery}%,thesis.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3. Search Markets
    const { data: markets } = await supabase
      .from('markets')
      .select('*')
      .or(`title.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`)
      .limit(10);

    return {
      query: queryStr,
      network,
      creators: creators || [],
      callouts: callouts || [],
      markets: markets || [],
    };
  }
}

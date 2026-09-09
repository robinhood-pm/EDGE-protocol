import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Strict environment variable checking (No fallback `||`)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env! Backend halted for safety.");
}

// Instantiate Supabase client using Service Role to bypass RLS for backend operations
export const supabase = createClient(supabaseUrl, supabaseKey);

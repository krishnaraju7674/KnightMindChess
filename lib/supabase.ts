import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabase = isConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, detectSessionInUrl: false },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
  }
  return supabase;
}

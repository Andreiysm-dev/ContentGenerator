import { createClient } from '@supabase/supabase-js';

const supabaseBaseUrl = (import.meta.env as any).VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseBaseUrl && supabaseAnonKey
    ? createClient(supabaseBaseUrl, supabaseAnonKey)
    : null;

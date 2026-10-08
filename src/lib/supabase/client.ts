import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Creates a Supabase client for Client Components (browser).
 * Uses @supabase/ssr to synchronize auth session state with cookies.
 */
export function createClient() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

export default createClient;

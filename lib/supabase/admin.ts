import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

// Force validate URL to prevent build crashes in Vercel if user enters malformed string
if (!supabaseUrl.startsWith('http')) {
  console.warn('[Supabase Admin] Invalid SUPABASE_URL detected, falling back to dummy url to prevent crash.');
  supabaseUrl = 'https://dummy.supabase.co';
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

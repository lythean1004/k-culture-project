import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

// Aggressive sanitization: remove whitespace, quotes, trailing slashes, and common API path suffixes
supabaseUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
if (supabaseUrl.includes('/rest/v1')) {
  supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

// Force validate URL to prevent build crashes
if (!supabaseUrl.startsWith('http')) {
  console.warn('[Supabase Admin] Invalid SUPABASE_URL detected, falling back to dummy url to prevent crash.');
  supabaseUrl = 'https://dummy.supabase.co';
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

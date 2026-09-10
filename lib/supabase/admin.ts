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

let unavailableUntil = 0;
const unavailable = () => new Response(JSON.stringify({ code: 'BACKEND_UNAVAILABLE', message: 'Database connection unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (input, init) => {
      if (Date.now() < unavailableUntil) return unavailable();
      try {
        const response = await fetch(input, { ...init, signal: AbortSignal.timeout(3000) });
        if (response.status === 401 || response.status === 403 || response.status >= 500) unavailableUntil = Date.now() + 30_000;
        return response;
      } catch {
        unavailableUntil = Date.now() + 30_000;
        return unavailable();
      }
    },
  },
});

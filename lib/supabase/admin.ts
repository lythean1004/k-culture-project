import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

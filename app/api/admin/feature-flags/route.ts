import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase) {
      return Response.json({
        success: true,
        data: [
          { flagId: 'flag-1', key: 'ai_reason_text', enabled: true, scope: 'GLOBAL', config: '{}' },
          { flagId: 'flag-2', key: 'ai_rerank', enabled: true, scope: 'GLOBAL', config: '{"weight": 0.8}' },
          { flagId: 'flag-3', key: 'weather_dynamic_curation', enabled: false, scope: 'GLOBAL', config: '{}' },
        ]
      });
    }

    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .select('flag_id, key, enabled, scope, config');

    if (error) throw error;

    const mapped = (data || []).map((f) => ({
      flagId: f.flag_id,
      key: f.key,
      enabled: f.enabled,
      scope: f.scope,
      config: JSON.stringify(f.config || {}),
    }));

    return Response.json({ success: true, data: mapped });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 550 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, enabled } = body;

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase) {
      return Response.json({ success: true, message: 'Updated locally (mocked)' });
    }

    const { error } = await supabaseAdmin
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 550 });
  }
}

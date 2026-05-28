import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, packageId, action } = body;

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabase) {
      console.warn('[Log API] Supabase config missing. Simulated logging action:', action);
      return Response.json({ success: true, message: 'Logged (mocked)' });
    }

    const payload: any = {
      session_id: sessionId || null,
      package_id: packageId,
    };

    const nowStr = new Date().toISOString();
    if (action === 'click_outlink') {
      payload.outlink_clicked_at = nowStr;
    } else if (action === 'save') {
      payload.saved_at = nowStr;
    } else if (action === 'click') {
      payload.clicked_at = nowStr;
    } else if (action === 'swap') {
      payload.swap_count = 1;
    }

    const { error } = await supabaseAdmin
      .from('recommendation_logs')
      .insert(payload);

    if (error) {
      console.error('[Log API] Failed to insert log to database:', error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('[Log API] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

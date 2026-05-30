import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { embedWithCache } from '../../../lib/ai/embedding/cache';
import { resolveCityId } from '../../../lib/recommend/candidates';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId = crypto.randomUUID(),
      lang = 'en',
      cityCode,
      cityCodes,
      visitForm,
      interests = [],
      transportMode = 'TRANSIT',
      freeTextQuery = '',
      currentLocation,
    } = body;

    if (!cityCode) {
      return Response.json({ success: false, error: 'cityCode is required' }, { status: 400 });
    }

    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 3. Upsert user_sessions table
    if (hasSupabase) {
      const payload: any = {
        session_id: sessionId,
        lang,
        city_code: Array.isArray(cityCodes) && cityCodes.length > 0 ? cityCodes.join(',') : cityCode,
        visit_form: visitForm,
        interests,
        transport_mode: transportMode,
        free_text_query: freeTextQuery,
      };

      if (currentLocation?.lat && currentLocation?.lng) {
        payload.lat = currentLocation.lat;
        payload.lng = currentLocation.lng;
      }

      const { error } = await supabaseAdmin
        .from('user_sessions')
        .upsert(payload, { onConflict: 'session_id' });

      if (error) {
        console.error('[Sessions API] Database upsert failed:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    } else {
      console.warn('[Sessions API] Supabase config missing. Simulating session save.');
    }

    return Response.json({ success: true, sessionId });
  } catch (error: any) {
    console.error('[Sessions API] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

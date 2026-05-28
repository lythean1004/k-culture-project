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
      visitForm,
      interests = [],
      transportMode = 'TRANSIT',
      freeTextQuery = '',
      consentLocation = false,
    } = body;

    if (!cityCode) {
      return Response.json({ success: false, error: 'cityCode is required' }, { status: 400 });
    }

    // 1. Resolve cityId from cityCode
    const cityId = await resolveCityId(cityCode);

    // 2. Generate embedding (interests + freeTextQuery)
    let userEmbedding: number[] | null = null;
    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasSupabase) {
      try {
        const textToEmbed = [
          ...interests,
          freeTextQuery
        ].filter(Boolean).join(' ');
        
        if (textToEmbed) {
          userEmbedding = await embedWithCache(textToEmbed, 'query');
        }
      } catch (e) {
        console.error('[Sessions API] Embedding generation failed:', e);
      }
    }

    // 3. Upsert user_sessions table
    if (hasSupabase) {
      const payload: any = {
        session_id: sessionId,
        lang,
        city_id: cityId,
        visit_form: visitForm,
        interests,
        transport_mode: transportMode,
        consent_location: consentLocation,
        last_activity_at: new Date().toISOString(),
      };

      if (userEmbedding) {
        payload.user_embedding = userEmbedding;
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

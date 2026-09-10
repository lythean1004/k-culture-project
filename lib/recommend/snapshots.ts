import { cache } from '../cache';
import { supabaseAdmin } from '../supabase/admin';
import { RecommendedPackage } from './types';

export async function storeSnapshot(pkg: RecommendedPackage): Promise<void> {
  await cache.set(`package:${pkg.packageId}`, JSON.stringify(pkg), 86400);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await supabaseAdmin.from('recommendation_snapshots').upsert({ package_id: pkg.packageId, payload: pkg });
    if (error) console.warn('[Snapshots] Persistence unavailable:', error.code);
  }
}

export async function loadSnapshot(id: string): Promise<RecommendedPackage | null> {
  const cached = await cache.get(`package:${id}`);
  if (cached) return JSON.parse(cached);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data } = await supabaseAdmin.from('recommendation_snapshots').select('payload').eq('package_id', id).maybeSingle();
    if (data?.payload) return data.payload as RecommendedPackage;
  }
  return null;
}

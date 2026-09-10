import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log(JSON.stringify({ configured: false, action: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment. Local catalog mode remains available.' }, null, 2));
  process.exitCode = 1;
} else {
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) } });
  const checks = {};
  for (const [table, columns] of Object.entries({ cities: 'city_id,code', places: 'place_id,city_id,name_ko,lat,lng', place_i18n: 'place_id,lang,name', place_theme_map: 'place_id,theme_id', events: 'event_id,city_id,status', recommendation_snapshots: 'package_id,payload' })) {
    const { error, count } = await client.from(table).select(columns, { count: 'exact', head: true });
    checks[table] = error ? { ok: false, code: error.code, message: error.message } : { ok: true, count };
  }
  const { data: cities } = await client.from('cities').select('code');
  console.log(JSON.stringify({ configured: true, checks, cities: cities?.map(city => city.code) || [] }, null, 2));
  if (Object.values(checks).some(check => !check.ok)) process.exitCode = 1;
}

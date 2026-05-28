import { getShortForecast } from '../lib/sources/kma';
import { supabaseAdmin } from '../lib/supabase/admin';
import pino from 'pino';

const logger = pino();

const CITIES_COORDS = [
  { name: 'seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'busan', lat: 35.1796, lng: 129.0756 },
  { name: 'gyeongju', lat: 35.8562, lng: 129.2247 },
  { name: 'jeonju', lat: 35.8242, lng: 127.1480 },
  { name: 'namwon', lat: 35.4163, lng: 127.3905 },
];

async function main() {
  logger.info('Starting KMA weather snapshots synchronization...');
  
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  for (const city of CITIES_COORDS) {
    try {
      logger.info(`Fetching short forecast for ${city.name} (${city.lat}, ${city.lng})`);
      const weather = await getShortForecast(city.lat, city.lng);
      
      logger.info({ city: city.name, weather }, 'Fetched weather data');

      if (hasSupabase) {
        const { error } = await supabaseAdmin.from('weather_snapshots').insert({
          area_key: city.name,
          forecast_at: new Date().toISOString(),
          precip_prob: weather.precipProb,
          temp_c: weather.tempC,
          weather_code: weather.weatherCode,
          source_name: 'KMA',
        });
        
        if (error) {
          logger.error({ city: city.name, error: error.message }, 'Failed to insert weather snapshot');
        } else {
          logger.info(`Successfully saved weather snapshot for ${city.name}`);
        }
      }
    } catch (err: any) {
      logger.error({ city: city.name, error: err.message }, 'Failed to sync weather for city');
    }
  }

  logger.info('KMA weather sync job finished.');
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});

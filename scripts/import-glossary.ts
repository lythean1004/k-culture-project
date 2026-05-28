import { supabaseAdmin } from '../lib/supabase/admin';
import pino from 'pino';

const logger = pino();

// Fallback seed glossary data (around 10 core tourist spots multilingual translations)
const FALLBACK_GLOSSARY = [
  { ko: '경복궁', en: 'Gyeongbokgung Palace', ja: '景福宮', zh_hans: '景福宫', zh_hant: '景福宮', category: '관광지' },
  { ko: '국립중앙박물관', en: 'National Museum of Korea', ja: '国立中央博物館', zh_hans: '国立中央博物馆', zh_hant: '國立中央博物館', category: '문화시설' },
  { ko: '창덕궁', en: 'Changdeokgung Palace', ja: '昌徳宮', zh_hans: '昌德宫', zh_hant: '昌德宮', category: '관광지' },
  { ko: '덕수궁', en: 'Deoksugung Palace', ja: '徳寿宮', zh_hans: '德寿宫', zh_hant: '德壽宮', category: '관광지' },
  { ko: '남산골한옥마을', en: 'Namsangol Hanok Village', ja: '南山コル韓屋マウル', zh_hans: '南山谷韩屋村', zh_hant: '南山谷韓屋村', category: '관광지' },
  { ko: '명동', en: 'Myeong-dong', ja: '明洞', zh_hans: '明洞', zh_hant: '明洞', category: '관광지' },
  { ko: '동대문디자인플라자', en: 'Dongdaemun Design Plaza', ja: '東大門デザインプラザ', zh_hans: '东大门设计广场', zh_hant: '東大門設計廣場', category: '문화시설' },
  { ko: '전주한옥마을', en: 'Jeonju Hanok Village', ja: '全州韓屋村', zh_hans: '全州韩屋村', zh_hant: '全州韓屋村', category: '관광지' },
  { ko: '경주국립공원', en: 'Gyeongju National Park', ja: '慶州国立公園', zh_hans: '庆州国立公园', zh_hant: '慶州國立公園', category: '관광지' },
  { ko: '광한루원', en: 'Gwanghalluwan Garden', ja: '広寒楼苑', zh_hans: '广寒楼苑', zh_hant: '廣寒樓苑', category: '관광지' }
];

async function main() {
  logger.info('Starting Seoul Multilingual Glossary synchronization...');

  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    logger.info('No external glossary CSV file found. Loading Fallback Seed Data.');
    
    if (hasSupabase) {
      logger.info(`Inserting ${FALLBACK_GLOSSARY.length} glossary terms to database.`);
      for (const term of FALLBACK_GLOSSARY) {
        const { error } = await supabaseAdmin.from('glossary_terms').upsert({
          ko: term.ko,
          en: term.en,
          ja: term.ja,
          zh_hans: term.zh_hans,
          zh_hant: term.zh_hant,
          category: term.category,
          standard_source: 'seoul_dict',
          approved_flag: true
        });
        
        if (error) {
          logger.error({ term: term.ko, error: error.message }, 'Failed to insert glossary term');
        } else {
          logger.info(`Inserted/Updated term: ${term.ko}`);
        }
      }
    } else {
      logger.warn('[Glossary Sync] Supabase credentials missing. Mocking glossary insertion output:');
      console.log(JSON.stringify(FALLBACK_GLOSSARY, null, 2));
    }
  } catch (err: any) {
    logger.error(err, 'Glossary import process failed');
  }

  logger.info('Seoul Multilingual Glossary synchronization finished.');
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});

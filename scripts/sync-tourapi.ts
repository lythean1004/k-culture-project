import { getAreaBasedList, getDetailCommon, mapTourApiToPlace } from '../lib/sources/tourapi';
import { findOrCreatePlace } from '../lib/normalize/place-normalizer';
import { supabaseAdmin } from '../lib/supabase/admin';
import pino from 'pino';

const logger = pino();

// TourAPI areaCodes: 서울(1), 부산(6), 경북 경주(35), 전북 전주/남원(37)
const CITY_MAP: Record<string, string> = {
  seoul: '1',
  busan: '6',
  gyeongju: '35',
  jeonju: '37',
  namwon: '37',
};

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const cityArg = args.find(arg => arg.startsWith('--city='))?.split('=')[1];

  let targetCities = ['1', '6', '35', '37'];
  if (cityArg && CITY_MAP[cityArg.toLowerCase()]) {
    targetCities = [CITY_MAP[cityArg.toLowerCase()]];
    logger.info(`Filtering sync for target city: ${cityArg}`);
  }

  if (isDryRun) {
    logger.info('Running TourAPI sync in DRY-RUN mode. Database writes are disabled.');
  }

  const contentTypes = [12, 14, 15, 39];
  const langs: Array<'en' | 'ja' | 'zh-Hans'> = ['en', 'ja', 'zh-Hans'];
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  
  for (const areaCode of targetCities) {
    for (const contentTypeId of contentTypes) {
      let page = 1;
      while (true) {
        try {
          logger.info(`Fetching TourAPI areaCode=${areaCode}, contentTypeId=${contentTypeId}, page=${page}`);
          const items = await getAreaBasedList({
            areaCode,
            contentTypeId,
            pageNo: page,
            numOfRows: 20, // 임시로 크기 조절
            lang: 'ko',
          });
          
          if (!items || items.length === 0) {
            break;
          }
          
          for (const item of items) {
            try {
              const normalizedKo = mapTourApiToPlace(item, 'ko');
              logger.info(`Processing place: ${normalizedKo.nameKo} (SourceID: ${normalizedKo.sourcePlaceId})`);
              
              if (!isDryRun) {
                const placeId = await findOrCreatePlace(normalizedKo);
                
                // Fetch translations from multi-language TourAPI details
                for (const lang of langs) {
                  try {
                    const detail = await getDetailCommon(item.contentid, lang);
                    if (detail) {
                      const normalizedLang = mapTourApiToPlace(detail, lang);
                      if (normalizedLang.nameI18n) {
                        await supabaseAdmin.from('place_i18n').upsert(
                          normalizedLang.nameI18n.map(i => ({
                            place_id: placeId,
                            lang: i.lang,
                            name: i.name,
                            short_desc: i.shortDesc || null,
                            long_desc: i.longDesc || null,
                            translation_source: 'OFFICIAL_HUMAN',
                            quality_grade: 'B',
                          }))
                        );
                        logger.info(`Synced ${lang} translation for place_id: ${placeId}`);
                      }
                    }
                  } catch (e: any) {
                    logger.warn({ contentId: item.contentid, lang, error: e.message }, 'i18n translation sync failed');
                  }
                }
                totalInserted++;
              } else {
                logger.info(`[Dry-Run] Would find or create place: ${normalizedKo.nameKo}`);
                totalInserted++;
              }
            } catch (e: any) {
              logger.error({ item: item.contentid, error: e.message }, 'Item processing failed');
              totalFailed++;
            }
          }
          
          // Next page logic (20개씩 가져와서 items가 20개 미만이면 마지막 페이지로 간주)
          if (items.length < 20) break;
          page++;
        } catch (e: any) {
          logger.error({ areaCode, contentTypeId, page, error: e.message }, 'Page loading failed');
          break;
        }
      }
    }
  }
  
  logger.info({ totalInserted, totalUpdated, totalFailed }, 'TourAPI sync job completed');
}

main().catch(e => { logger.error(e); process.exit(1); });

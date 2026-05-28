import { getAllMuseums, convertTm5174ToWgs84 } from '../lib/sources/museum-standard';
import { findOrCreatePlace } from '../lib/normalize/place-normalizer';
import pino from 'pino';

const logger = pino();

async function main() {
  logger.info('Starting Museum standard dataset synchronization...');
  
  try {
    logger.info('Fetching museum standard records from data.go.kr');
    const list = await getAllMuseums({ pageNo: 1, numOfRows: 50 });
    logger.info(`Loaded ${list.length} museums from standard dataset`);

    for (const item of list) {
      try {
        let lat = item.latitude ? parseFloat(item.latitude) : undefined;
        let lng = item.longitude ? parseFloat(item.longitude) : undefined;
        
        // If coordinate values are TM coordinates (e.g. from epsg:5174), convert them
        if ((!lat || !lng) && item.tmX && item.tmY) {
          const [convertedLng, convertedLat] = convertTm5174ToWgs84(parseFloat(item.tmX), parseFloat(item.tmY));
          lat = convertedLat;
          lng = convertedLng;
        }

        const normalizedPlace = {
          sourceName: 'MUSEUM_STD' as const,
          sourcePlaceId: item.fcltyNm,
          primaryType: 'MUSEUM' as const,
          nameKo: item.fcltyNm,
          addrKo: item.rdnmadr || item.lnmadr || undefined,
          lat,
          lng,
          phone: item.phoneNumber || undefined,
          officialUrl: item.homepageUrl || undefined,
          rawJson: item,
        };

        logger.info(`Syncing standard museum: ${normalizedPlace.nameKo}`);
        const placeId = await findOrCreatePlace(normalizedPlace);
        logger.info(`Successfully synced museum, place_id: ${placeId}`);
      } catch (err: any) {
        logger.error({ fcltyNm: item.fcltyNm, error: err.message }, 'Failed to sync museum standard record');
      }
    }
  } catch (error: any) {
    logger.error(error, 'Museum standard sync process failed');
  }

  logger.info('Museum standard data synchronization finished.');
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});

import { getPerformanceList, getPerformanceDetail, mapKopisToEvent } from '../lib/sources/kopis';
import { findOrCreateEvent } from '../lib/normalize/event-normalizer';
import pino from 'pino';

const logger = pino();

async function main() {
  logger.info('Starting KOPIS event synchronization...');
  
  const now = new Date();
  const formatKopisDate = (date: Date) => {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  };
  
  const stdate = formatKopisDate(now);
  const future = new Date();
  future.setMonth(now.getMonth() + 3);
  const eddate = formatKopisDate(future);

  try {
    logger.info(`Requesting Kopis list from ${stdate} to ${eddate}`);
    const items = await getPerformanceList({
      stdate,
      eddate,
      rows: 20,
    });

    logger.info(`Fetched ${items.length} performances to sync.`);

    for (const item of items) {
      try {
        const detail = await getPerformanceDetail(item.mt20id);
        const rawData = detail || item;
        const normalized = mapKopisToEvent(rawData);
        
        logger.info(`Syncing event: ${normalized.titleKo} (KOPIS ID: ${normalized.sourceEventId})`);
        const eventId = await findOrCreateEvent(normalized);
        logger.info(`Synced event_id: ${eventId}`);
      } catch (err: any) {
        logger.error({ mt20id: item.mt20id, error: err.message }, 'Individual Kopis entry failed');
      }
    }
  } catch (error: any) {
    logger.error(error, 'KOPIS synchronization job failed');
  }

  logger.info('KOPIS synchronization finished.');
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});

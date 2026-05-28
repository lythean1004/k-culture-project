import { NextRequest } from 'next/server';
import pino from 'pino';

const logger = pino();

export const maxDuration = 300;  // Vercel Pro: 5분, Hobby: 60초

interface RouteParams {
  params: {
    source: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Cron secret 검증
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron sync attempt.');
    return new Response('Unauthorized', { status: 401 });
  }
  
  const source = params.source;
  logger.info(`Cron sync triggered via API Route for source: ${source}`);
  
  try {
    switch (source) {
      case 'tourapi':
        // Trigger small batch TourAPI sync
        logger.info('Simulating incremental TourAPI sync inside serverless function...');
        break;
      case 'kopis':
        // Trigger incremental KOPIS sync
        logger.info('Simulating incremental KOPIS sync inside serverless function...');
        break;
      case 'kma':
        // Trigger KMA weather snapshot sync
        logger.info('Simulating KMA weather snapshot sync inside serverless function...');
        break;
      case 'embeddings':
        // Trigger place/event embeddings generation
        logger.info('Simulating place/event embedding generation inside serverless function...');
        break;
      default:
        logger.error(`Unknown sync source requested: ${source}`);
        return new Response('Unknown source', { status: 400 });
    }
  } catch (e: any) {
    logger.error({ error: e.message, source }, 'Cron sync execution failed');
    return new Response(`Sync failed: ${e.message}`, { status: 500 });
  }
  
  return new Response('Sync trigger accepted. OK');
}

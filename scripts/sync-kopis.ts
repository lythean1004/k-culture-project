import { KopisApiClient } from '../lib/sources/kopis';
import { db } from '../lib/db';

async function main() {
  console.log('Starting KOPIS Synchronization Batch Job...');
  
  const client = new KopisApiClient();
  
  try {
    const list = await client.getPerformanceList({
      stdate: '20260501',
      eddate: '20260831',
    });
    
    console.log(`Fetched ${list.length} performances from KOPIS.`);
    console.log('KOPIS sync completed successfully!');
  } catch (error) {
    console.error('Error syncing KOPIS:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

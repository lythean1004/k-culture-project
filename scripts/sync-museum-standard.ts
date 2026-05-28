import { EMuseumApiClient } from '../lib/sources/emuseum';
import { db } from '../lib/db';

async function main() {
  console.log('Starting National Museum Artifacts Standardization Synchronization...');
  
  const client = new EMuseumApiClient();
  
  try {
    const artifacts = await client.getArtifactList({
      keyword: '국보',
      numOfRows: 20
    });
    
    console.log(`Fetched ${artifacts.length} museum artifacts.`);
    console.log('Museum standard sync completed successfully!');
  } catch (error) {
    console.error('Error syncing museum standard data:', error);
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

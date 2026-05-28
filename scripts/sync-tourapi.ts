import { TourApiClient } from '../lib/sources/tourapi';
import { db } from '../lib/db';

async function main() {
  console.log('Starting TourAPI Synchronization Batch Job...');
  
  const client = new TourApiClient();
  
  // Example logic to fetch and store
  try {
    // 5개 도시: 서울(1), 부산(6), 경주(35), 전주(37), 남원(37-일부 지역 코드 상세 필터 필요)
    // 여기서는 간단하게 서울 지역 예시로 동기화 처리 시뮬레이션
    const list = await client.getAreaBasedList({
      areaCode: '1',
      contentTypeId: '76', // 관광지
      lang: 'Eng'
    });
    
    console.log(`Fetched ${list.length} places from TourAPI.`);
    console.log('TourAPI sync completed successfully!');
  } catch (error) {
    console.error('Error syncing TourAPI:', error);
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

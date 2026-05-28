import { db } from '../db';

export interface RecommendRequest {
  cityId: string;
  travelType: 'solo' | 'family' | 'friends';
  interests: string[];
}

export async function getCandidates(req: RecommendRequest) {
  // DB에서 특정 도시 및 조건에 부합하는 장소 및 공연/전시 조회
  console.log(`Getting candidate places and events for ${req.cityId}`);
  
  // prisma db client를 사용한 mock query logic
  return {
    places: [
      { id: 'p1', nameKo: '경복궁', category: 'attraction', latitude: 37.5796, longitude: 126.9770 },
      { id: 'p2', nameKo: '국립중앙박물관', category: 'museum', latitude: 37.5240, longitude: 126.9804 }
    ],
    events: [
      { id: 'e1', titleKo: '궁궐 야간개장', placeName: '경복궁' }
    ]
  };
}

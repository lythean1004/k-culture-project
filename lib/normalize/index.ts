// 정규화 레이어 (Normalization Layer)
// 다양한 외부 공공 API의 데이터를 플랫폼 표준 포맷으로 변환합니다.

export interface NormalizedPlace {
  source: string;
  sourceId: string;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZhCn: string;
  nameZhTw: string;
  description?: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  externalUrl?: string;
  imageUrl?: string;
}

export interface NormalizedEvent {
  source: string;
  sourceId: string;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  titleZhCn: string;
  titleZhTw: string;
  description?: string;
  category: string;
  startDate: Date;
  endDate: Date;
  placeName: string;
  latitude?: number;
  longitude?: number;
  externalUrl?: string;
  imageUrl?: string;
}

export function normalizeTourApiPlace(raw: any): NormalizedPlace {
  return {
    source: 'tourapi',
    sourceId: raw.contentid,
    nameKo: raw.title || '',
    nameEn: raw.title_en || '',
    nameJa: raw.title_ja || '',
    nameZhCn: raw.title_zh_cn || '',
    nameZhTw: raw.title_zh_tw || '',
    description: raw.overview,
    category: mapTourApiCategory(raw.contenttypeid),
    address: raw.addr1 || '',
    latitude: parseFloat(raw.mapy) || 0,
    longitude: parseFloat(raw.mapx) || 0,
    externalUrl: raw.homepage,
    imageUrl: raw.firstimage,
  };
}

function mapTourApiCategory(contentTypeId: string): string {
  // TourAPI contentTypeId를 내부 카테고리로 변환
  // 76: 관광지, 78: 문화시설, 85: 축제공연행사, etc. (다국어 기준)
  switch (contentTypeId) {
    case '76': return 'attraction';
    case '78': return 'museum';
    default: return 'place';
  }
}

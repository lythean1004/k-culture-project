import { describe, it, expect } from 'vitest';
import { mapTourApiToPlace } from '../../lib/sources/tourapi';

describe('TourAPI Mapper Test', () => {
  it('should map raw TourAPI response to NormalizedPlace correctly in ko', () => {
    const rawFixture = {
      contentid: '12345',
      contenttypeid: '12', // ATTRACTION
      title: '경복궁',
      addr1: '서울특별시 종로구 사직로 161',
      mapx: '126.9770',
      mapy: '37.5796',
      homepage: 'http://www.royalpalace.go.kr',
      tel: '02-3700-3900',
    };

    const result = mapTourApiToPlace(rawFixture, 'ko');

    expect(result.sourceName).toBe('TOURAPI');
    expect(result.sourcePlaceId).toBe('12345');
    expect(result.primaryType).toBe('ATTRACTION');
    expect(result.nameKo).toBe('경복궁');
    expect(result.nameI18n).toBeUndefined();
    expect(result.lat).toBe(37.5796);
    expect(result.lng).toBe(126.9770);
    expect(result.officialUrl).toBe('http://www.royalpalace.go.kr');
    expect(result.phone).toBe('02-3700-3900');
  });

  it('should map raw TourAPI response to NormalizedPlace correctly in en', () => {
    const rawFixture = {
      contentid: '12345',
      contenttypeid: '14', // MUSEUM
      title: 'Gyeongbokgung Palace',
      addr1: '161, Sajik-ro, Jongno-gu, Seoul',
      mapx: '126.9770',
      mapy: '37.5796',
      homepage: 'http://www.royalpalace.go.kr',
      tel: '02-3700-3900',
    };

    const result = mapTourApiToPlace(rawFixture, 'en');

    expect(result.sourceName).toBe('TOURAPI');
    expect(result.sourcePlaceId).toBe('12345');
    expect(result.primaryType).toBe('MUSEUM');
    expect(result.nameKo).toBeUndefined();
    expect(result.nameI18n).toEqual([{ lang: 'en', name: 'Gyeongbokgung Palace', shortDesc: undefined }]);
  });
});

import { describe, it, expect } from 'vitest';
import { mapKopisToEvent } from '../../lib/sources/kopis';

describe('KOPIS Mapper Test', () => {
  it('should map raw KOPIS response to NormalizedEvent correctly', () => {
    const rawFixture = {
      mt20id: 'PF123456',
      prfnm: '국악 한마당',
      prfpdfrom: '2026.05.01',
      prfpdto: '2026.05.31',
      fcltynm: '국립국악원 우면당',
      poster: 'http://example.com/poster.jpg',
      genrenm: '국악',
      relateurl: 'http://example.com/ticket',
    };

    const result = mapKopisToEvent(rawFixture);

    expect(result.sourceName).toBe('KOPIS');
    expect(result.sourceEventId).toBe('PF123456');
    expect(result.eventType).toBe('PERFORMANCE');
    expect(result.titleKo).toBe('국악 한마당');
    expect(result.venueName).toBe('국립국악원 우면당');
    expect(result.genre).toBe('TRADITIONAL_MUSIC');
    expect(result.posterUrl).toBe('http://example.com/poster.jpg');
    expect(result.officialUrl).toBe('http://example.com/ticket');
    expect(result.sessions[0].startAt).toEqual(new Date('2026-05-01'));
    expect(result.sessions[0].endAt).toEqual(new Date('2026-05-31'));
  });
});

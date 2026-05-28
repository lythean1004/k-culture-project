import { z } from 'zod';
import { ofetch } from 'ofetch';
import { XMLParser } from 'fast-xml-parser';
import { createRateLimiter, retryWithBackoff, SourceApiError } from './_common';
import { NormalizedEvent, EventGenre } from './_types';

const kopisLimiter = createRateLimiter(1, 100); // 10/sec -> minTime 100ms
const xmlParser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
});

const KOPIS_BASE = 'http://kopis.or.kr/openApi/restful';

export const FOREIGNER_FRIENDLY_GENRES = ['BCCB', 'GGGA', 'CCCD'];

// Zod schemas
const kopisPerformanceSchema = z.object({
  mt20id: z.string(),
  prfnm: z.string(),
  prfpdfrom: z.string(),
  prfpdto: z.string(),
  fcltynm: z.string().optional().nullable(),
  poster: z.string().optional().nullable(),
  genrenm: z.string().optional().nullable(),
  prfstate: z.string().optional().nullable(),
  openrun: z.string().optional().nullable(),
  dtguidance: z.string().optional().nullable(),
  prfruntime: z.string().optional().nullable(),
  relateurl: z.string().optional().nullable(),
  lval: z.string().optional().nullable(),
  la: z.string().optional().nullable(),
  lo: z.string().optional().nullable(),
}).passthrough();

const kopisListResponseSchema = z.object({
  dbs: z.object({
    db: z.union([
      z.array(kopisPerformanceSchema),
      kopisPerformanceSchema,
    ]).optional().nullable(),
  }).optional().nullable(),
});

async function fetchKopisApi(path: string, query: Record<string, any>): Promise<any[]> {
  const apiKey = process.env.KOPIS_API_KEY || 'test-key';
  const url = `${KOPIS_BASE}${path}`;
  const fullQuery = {
    service: apiKey,
    ...query,
  };

  const executeCall = async () => {
    try {
      const xmlText = await ofetch(url, {
        query: fullQuery,
        timeout: 10000,
        parseResponse: (txt) => txt,
      });

      const parsedXml = xmlParser.parse(xmlText);
      const validated = kopisListResponseSchema.safeParse(parsedXml);

      if (!validated.success) {
        throw new SourceApiError('KOPIS', 200, false, `XML parse or Zod failed: ${validated.error.message}`);
      }

      const dbContent = validated.data.dbs?.db;
      if (!dbContent) return [];
      return Array.isArray(dbContent) ? dbContent : [dbContent];
    } catch (error: any) {
      if (error instanceof SourceApiError) throw error;
      const isRetriable = error.status ? error.status >= 500 : true;
      throw new SourceApiError('KOPIS', error.status || null, isRetriable, error.message || 'Network error');
    }
  };

  return kopisLimiter.schedule(() => retryWithBackoff(executeCall));
}

export async function getPerformanceList(params: {
  stdate: string;        // YYYYMMDD
  eddate: string;        // YYYYMMDD
  cpage?: number;
  rows?: number;
  shcate?: string;       // 장르 코드
  signgucode?: string;   // 지역 코드
}) {
  const query: Record<string, any> = {
    stdate: params.stdate,
    eddate: params.eddate,
    cpage: params.cpage ?? 1,
    rows: params.rows ?? 10,
  };
  if (params.shcate) query.shcate = params.shcate;
  if (params.signgucode) query.signgucode = params.signgucode;

  return fetchKopisApi('/pblprfr', query);
}

export async function getPerformanceDetail(mt20id: string) {
  const list = await fetchKopisApi(`/pblprfr/${mt20id}`, {});
  return list.length > 0 ? list[0] : null;
}

export async function getVenueList(params: {
  cpage?: number;
  rows?: number;
  shprfc?: string; // 공연시설명
}) {
  const query: Record<string, any> = {
    cpage: params.cpage ?? 1,
    rows: params.rows ?? 10,
  };
  if (params.shprfc) query.shprfc = params.shprfc;
  return fetchKopisApi('/prfplc', query);
}

function mapKopisGenre(genreName?: string | null): EventGenre {
  if (!genreName) return 'ETC';
  const name = genreName.trim();
  if (name.includes('국악') || name.includes('전통')) return 'TRADITIONAL_MUSIC';
  if (name.includes('무용') || name.includes('발레') || name.includes('댄스')) return 'DANCE';
  if (name.includes('뮤지컬')) return 'MUSICAL';
  if (name.includes('클래식') || name.includes('오페라') || name.includes('독창')) return 'CLASSICAL';
  if (name.includes('연극') && (name.includes('넌버벌') || name.includes('non-verbal'))) return 'NON_VERBAL';
  return 'ETC';
}

function parseSessions(fromStr: string, toStr: string): Array<{ startAt: Date; endAt?: Date }> {
  // YYYY.MM.DD 포맷 파싱
  const startAt = new Date(fromStr.replace(/\./g, '-'));
  const endAt = new Date(toStr.replace(/\./g, '-'));
  return [{ startAt, endAt }];
}

export function mapKopisToEvent(raw: any): NormalizedEvent {
  const genre = mapKopisGenre(raw.genrenm);
  return {
    sourceName: 'KOPIS',
    sourceEventId: raw.mt20id,
    eventType: 'PERFORMANCE',
    titleKo: raw.prfnm,
    venueName: raw.fcltynm || undefined,
    genre,
    posterUrl: raw.poster || undefined,
    officialUrl: raw.relateurl || undefined,
    foreignerFriendly: FOREIGNER_FRIENDLY_GENRES.includes(raw.genrenm || ''),
    sessions: parseSessions(raw.prfpdfrom, raw.prfpdto),
    rawJson: raw,
  };
}

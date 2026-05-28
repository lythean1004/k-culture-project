import { z } from 'zod';
import { ofetch } from 'ofetch';
import { createRateLimiter, retryWithBackoff, SourceApiError } from './_common';
import { NormalizedPlace, PlacePrimaryType } from './_types';

const tourApiLimiter = createRateLimiter(1, 200); // 5/sec -> minTime 200ms

const TOURAPI_BASE = {
  ko: 'https://apis.data.go.kr/B551011/KorService2',
  en: 'https://apis.data.go.kr/B551011/EngService2',
  ja: 'https://apis.data.go.kr/B551011/JpnService2',
  'zh-Hans': 'https://apis.data.go.kr/B551011/ChsService2',
} as const;

const KEY_MAP = {
  ko: process.env.TOURAPI_KEY,
  en: process.env.TOURAPI_KEY_EN,
  ja: process.env.TOURAPI_KEY_JA,
  'zh-Hans': process.env.TOURAPI_KEY_ZH,
} as const;

// Content Type 매핑
export const TOURAPI_CONTENT_TYPES = {
  12: 'ATTRACTION',
  14: 'CULTURE_FACILITY',
  15: 'FESTIVAL_PERFORMANCE',
  38: 'SHOPPING',
  39: 'RESTAURANT',
} as const;

// Zod 검증 스키마
const tourApiItemSchema = z.object({
  contentid: z.string(),
  contenttypeid: z.string(),
  title: z.string(),
  addr1: z.string().optional().nullable(),
  addr2: z.string().optional().nullable(),
  mapx: z.string().optional().nullable(),
  mapy: z.string().optional().nullable(),
  firstimage: z.string().optional().nullable(),
  firstimage2: z.string().optional().nullable(),
  tel: z.string().optional().nullable(),
  homepage: z.string().optional().nullable(),
  overview: z.string().optional().nullable(),
}).passthrough();

const tourApiResponseSchema = z.object({
  response: z.object({
    header: z.object({
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
    body: z.object({
      items: z.union([
        z.object({
          item: z.array(tourApiItemSchema),
        }),
        z.string(), // 빈 결과일 때 공백문자 대응
      ]).optional().nullable(),
      numOfRows: z.number().optional().nullable(),
      pageNo: z.number().optional().nullable(),
      totalCount: z.number().optional().nullable(),
    }).optional().nullable(),
  }),
});

async function fetchTourApi(
  endpointUrl: string,
  query: Record<string, any>,
  lang: 'ko' | 'en' | 'ja' | 'zh-Hans'
): Promise<any[]> {
  const apiKey = KEY_MAP[lang] || process.env.DATA_GO_KR_API_KEY || '';
  const fullQuery = {
    serviceKey: apiKey,
    MobileOS: 'ETC',
    MobileApp: 'KCulturePlatform',
    _type: 'json',
    ...query,
  };

  const executeCall = async () => {
    try {
      const response = await ofetch(endpointUrl, {
        query: fullQuery,
        timeout: 10000,
      });

      const parsed = tourApiResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw new SourceApiError('TOURAPI', 200, false, `Zod validation failed: ${parsed.error.message}`);
      }

      const header = parsed.data.response.header;
      if (header.resultCode !== '0000') {
        const isRetriable = ['01', '04', '12', '22', '99'].includes(header.resultCode);
        throw new SourceApiError(
          'TOURAPI',
          200,
          isRetriable,
          `TourAPI Error Code: ${header.resultCode}, Message: ${header.resultMsg}`
        );
      }

      const body = parsed.data.response.body;
      if (!body || !body.items || typeof body.items === 'string') {
        return [];
      }
      return body.items.item;
    } catch (error: any) {
      if (error instanceof SourceApiError) {
        throw error;
      }
      const isRetriable = error.status ? error.status >= 500 : true;
      throw new SourceApiError('TOURAPI', error.status || null, isRetriable, error.message || 'Network error');
    }
  };

  return tourApiLimiter.schedule(() => retryWithBackoff(executeCall));
}

export async function getAreaBasedList(params: {
  areaCode: string;
  contentTypeId?: number;
  pageNo?: number;
  numOfRows?: number;
  lang?: 'ko' | 'en' | 'ja' | 'zh-Hans';
}) {
  const lang = params.lang ?? 'ko';
  const url = `${TOURAPI_BASE[lang]}/areaBasedList2`;
  const query: Record<string, any> = {
    areaCode: params.areaCode,
    pageNo: params.pageNo ?? 1,
    numOfRows: params.numOfRows ?? 10,
  };
  if (params.contentTypeId) {
    query.contentTypeId = params.contentTypeId;
  }
  return fetchTourApi(url, query, lang);
}

export async function getLocationBasedList(params: {
  mapX: number;
  mapY: number;
  radius: number;
  contentTypeId?: number;
  pageNo?: number;
  numOfRows?: number;
  lang?: 'ko' | 'en' | 'ja' | 'zh-Hans';
}) {
  const lang = params.lang ?? 'ko';
  const url = `${TOURAPI_BASE[lang]}/locationBasedList2`;
  const query: Record<string, any> = {
    mapX: params.mapX,
    mapY: params.mapY,
    radius: params.radius,
    pageNo: params.pageNo ?? 1,
    numOfRows: params.numOfRows ?? 10,
  };
  if (params.contentTypeId) {
    query.contentTypeId = params.contentTypeId;
  }
  return fetchTourApi(url, query, lang);
}

export async function getDetailCommon(contentId: string, lang: 'ko' | 'en' | 'ja' | 'zh-Hans' = 'ko') {
  const url = `${TOURAPI_BASE[lang]}/detailCommon2`;
  const query = {
    contentId,
    defaultYN: 'Y',
    firstImageYN: 'Y',
    addrinfoYN: 'Y',
    mapinfoYN: 'Y',
    overviewYN: 'Y',
  };
  const list = await fetchTourApi(url, query, lang);
  return list.length > 0 ? list[0] : null;
}

export async function getDetailIntro(contentId: string, contentTypeId: number, lang: 'ko' | 'en' | 'ja' | 'zh-Hans' = 'ko') {
  const url = `${TOURAPI_BASE[lang]}/detailIntro2`;
  const query = {
    contentId,
    contentTypeId,
  };
  const list = await fetchTourApi(url, query, lang);
  return list.length > 0 ? list[0] : null;
}

export async function getDetailImage(contentId: string, lang: 'ko' | 'en' | 'ja' | 'zh-Hans' = 'ko') {
  const url = `${TOURAPI_BASE[lang]}/detailImage2`;
  const query = {
    contentId,
    imageYN: 'Y',
    subImageYN: 'Y',
  };
  return fetchTourApi(url, query, lang);
}

function mapContentTypeToPrimaryType(contentTypeId: string): PlacePrimaryType {
  switch (contentTypeId) {
    case '12': return 'ATTRACTION';
    case '14': return 'MUSEUM';
    case '15': return 'PERFORMANCE_VENUE';
    case '38': return 'MARKET';
    case '39': return 'MARKET';
    default: return 'ATTRACTION';
  }
}

export function mapTourApiToPlace(raw: any, lang: 'ko' | 'en' | 'ja' | 'zh-Hans'): NormalizedPlace {
  const primaryType = mapContentTypeToPrimaryType(raw.contenttypeid);
  return {
    sourceName: 'TOURAPI',
    sourcePlaceId: raw.contentid,
    primaryType,
    nameKo: lang === 'ko' ? raw.title : undefined,
    nameI18n: lang !== 'ko' ? [{ lang, name: raw.title, shortDesc: raw.overview }] : undefined,
    addrKo: lang === 'ko' ? raw.addr1 : undefined,
    lat: raw.mapy ? parseFloat(raw.mapy) : undefined,
    lng: raw.mapx ? parseFloat(raw.mapx) : undefined,
    officialUrl: raw.homepage || undefined,
    phone: raw.tel || undefined,
    rawJson: raw,
  };
}

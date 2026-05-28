import { z } from 'zod';
import { ofetch } from 'ofetch';
import { retryWithBackoff, SourceApiError } from './_common';

const CULTURE_DATA_BASE = 'http://api.kcisa.or.kr/openapi/service/rest';

// Zod Schema
const cultureItemSchema = z.object({
  title: z.string(),
  venue: z.string().optional().nullable(),
  eventPeriod: z.string().optional().nullable(),
  spatialCoverage: z.string().optional().nullable(),
  referenceIdentifier: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  imageObject: z.string().optional().nullable(),
}).passthrough();

const cultureResponseSchema = z.object({
  response: z.object({
    header: z.object({
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
    body: z.object({
      items: z.union([
        z.object({
          item: z.array(cultureItemSchema),
        }),
        z.string(),
      ]).optional().nullable(),
    }).optional().nullable(),
  }),
});

async function fetchCultureApi(url: string, query: Record<string, any>): Promise<any[]> {
  const apiKey = process.env.DATA_GO_KR_API_KEY || 'test-key';
  const fullQuery = {
    serviceKey: apiKey,
    dataType: 'json',
    ...query,
  };

  const executeCall = async () => {
    try {
      const response = await ofetch(url, {
        query: fullQuery,
        timeout: 10000,
      });

      const parsed = cultureResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw new SourceApiError('CULTURE_DATA', 200, false, `Zod validation failed: ${parsed.error.message}`);
      }

      const header = parsed.data.response.header;
      if (header.resultCode !== '0000' && header.resultCode !== '00') {
        throw new SourceApiError('CULTURE_DATA', 200, true, `CultureData Error: ${header.resultMsg}`);
      }

      const itemsBody = parsed.data.response.body?.items;
      const items = (itemsBody && typeof itemsBody === 'object' && 'item' in itemsBody) ? itemsBody.item : undefined;
      if (!items) return [];
      return Array.isArray(items) ? items : [items];
    } catch (error: any) {
      if (error instanceof SourceApiError) throw error;
      throw new SourceApiError('CULTURE_DATA', error.status || null, true, error.message || 'Network error');
    }
  };

  return retryWithBackoff(executeCall);
}

export async function getFestivalList(params: {
  sido?: string;
  gugun?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${CULTURE_DATA_BASE}/meta/culturalEvent`; // 문화행사 정보
  const query: Record<string, any> = {
    numOfRows: params.numOfRows ?? 10,
    pageNo: params.pageNo ?? 1,
  };
  if (params.sido) query.sido = params.sido;
  if (params.gugun) query.gugun = params.gugun;

  return fetchCultureApi(url, query);
}

export async function getCultureFacilityList(params: {
  sido?: string;
  numOfRows?: number;
  pageNo?: number;
}) {
  const url = `${CULTURE_DATA_BASE}/meta/culturalFacility`; // 문화시설 정보
  const query: Record<string, any> = {
    numOfRows: params.numOfRows ?? 10,
    pageNo: params.pageNo ?? 1,
  };
  if (params.sido) query.sido = params.sido;

  return fetchCultureApi(url, query);
}

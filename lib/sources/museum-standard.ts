import { z } from 'zod';
import { ofetch } from 'ofetch';
import proj4 from 'proj4';
import { retryWithBackoff, SourceApiError } from './_common';

// EPSG:5174 (TM 중부원점) → WGS84 변환
proj4.defs('EPSG:5174', '+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel');

export function convertTm5174ToWgs84(x: number, y: number): [number, number] {
  return proj4('EPSG:5174', 'EPSG:4326', [x, y]);
}

const MUSEUM_STD_BASE = 'http://api.data.go.kr/openapi/tn_pubr_public_museum_art_show_api';

// Zod Schema
const museumStdItemSchema = z.object({
  fcltyNm: z.string(),
  fcltyType: z.string().optional().nullable(),
  rdnmadr: z.string().optional().nullable(),
  lnmadr: z.string().optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  homepageUrl: z.string().optional().nullable(),
  operOpenTime: z.string().optional().nullable(),
  operCloseTime: z.string().optional().nullable(),
  rstde: z.string().optional().nullable(),
}).passthrough();

const museumStdResponseSchema = z.object({
  response: z.object({
    header: z.object({
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
    body: z.object({
      items: z.array(museumStdItemSchema).optional().nullable(),
      totalCount: z.string().optional().nullable(),
    }).optional().nullable(),
  }),
});

async function fetchMuseumStdApi(query: Record<string, any>): Promise<any[]> {
  const apiKey = process.env.DATA_GO_KR_API_KEY || 'test-key';
  const fullQuery = {
    serviceKey: apiKey,
    type: 'json',
    ...query,
  };

  const executeCall = async () => {
    try {
      const response = await ofetch(MUSEUM_STD_BASE, {
        query: fullQuery,
        timeout: 10000,
      });

      const parsed = museumStdResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw new SourceApiError('MUSEUM_STD', 200, false, `Zod validation failed: ${parsed.error.message}`);
      }

      const header = parsed.data.response.header;
      if (header.resultCode !== '00' && header.resultCode !== '0000') {
        throw new SourceApiError('MUSEUM_STD', 200, true, `Museum Standard Data Error: ${header.resultMsg}`);
      }

      return parsed.data.response.body?.items || [];
    } catch (error: any) {
      if (error instanceof SourceApiError) throw error;
      throw new SourceApiError('MUSEUM_STD', error.status || null, true, error.message || 'Network error');
    }
  };

  return retryWithBackoff(executeCall);
}

export async function getAllMuseums(params: {
  pageNo?: number;
  numOfRows?: number;
}) {
  const query = {
    pageNo: params.pageNo ?? 1,
    numOfRows: params.numOfRows ?? 10,
  };
  return fetchMuseumStdApi(query);
}

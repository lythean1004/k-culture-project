import { z } from 'zod';
import { ofetch } from 'ofetch';
import { XMLParser } from 'fast-xml-parser';
import { retryWithBackoff, SourceApiError } from './_common';

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
});

const EMUSEUM_BASE = 'https://www.emuseum.go.kr/openapi';

export const MUSEUM_CODES = {
  CENTRAL: 'PS01001001',          // 국립중앙박물관
  GYEONGJU: 'PS01001002',         // 국립경주박물관
  JEONJU: 'PS01001005',           // 국립전주박물관
} as const;

// Zod Schema
const emuseumRelicSchema = z.object({
  relicId: z.string(),
  relicName: z.string(),
  museumName: z.string().optional().nullable(),
  imgUrl: z.string().optional().nullable(),
  desc: z.string().optional().nullable(),
}).passthrough();

const emuseumResponseSchema = z.object({
  response: z.object({
    header: z.object({
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
    body: z.object({
      items: z.union([
        z.object({
          item: z.array(emuseumRelicSchema),
        }),
        z.string(),
      ]).optional().nullable(),
      totalCount: z.string().optional().nullable(),
    }).optional().nullable(),
  }),
});

async function fetchEmuseumApi(path: string, query: Record<string, any>): Promise<any[]> {
  const apiKey = process.env.E_MUSEUM_API_KEY || 'test-key';
  const url = `${EMUSEUM_BASE}${path}`;
  const fullQuery = {
    key: apiKey,
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
      const validated = emuseumResponseSchema.safeParse(parsedXml);

      if (!validated.success) {
        throw new SourceApiError('EMUSEUM', 200, false, `XML parsing or Zod failed: ${validated.error.message}`);
      }

      const header = validated.data.response.header;
      if (header.resultCode !== '0000' && header.resultCode !== '0') {
        throw new SourceApiError('EMUSEUM', 200, true, `e-Museum Error: ${header.resultMsg}`);
      }

      const itemsBody = validated.data.response.body?.items;
      const items = (itemsBody && typeof itemsBody === 'object' && 'item' in itemsBody) ? itemsBody.item : undefined;
      if (!items) return [];
      return Array.isArray(items) ? items : [items];
    } catch (error: any) {
      if (error instanceof SourceApiError) throw error;
      throw new SourceApiError('EMUSEUM', error.status || null, true, error.message || 'Network error');
    }
  };

  return retryWithBackoff(executeCall);
}

export async function getRelicList(params: {
  numOfRows?: number;
  pageNo?: number;
  query?: string;
  museumCode?: string;
}) {
  const query: Record<string, any> = {
    numOfRows: params.numOfRows ?? 10,
    pageNo: params.pageNo ?? 1,
  };
  if (params.query) query.query = params.query;
  if (params.museumCode) query.museumCode = params.museumCode;

  return fetchEmuseumApi('/relic/list', query);
}

export async function getRelicDetail(id: string) {
  const list = await fetchEmuseumApi('/relic/detail', { relicId: id });
  return list.length > 0 ? list[0] : null;
}

export async function getCodeList(parentCode: string) {
  return fetchEmuseumApi('/code/list', { parentCode });
}

import { z } from 'zod';
import { ofetch } from 'ofetch';
import { retryWithBackoff, SourceApiError } from './_common';

// 격자 변환 (Lambert Conformal Conic)
export function dfsXyConv(lat: number, lng: number): { nx: number; ny: number } {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

export interface NormalizedWeather {
  precipProb: number;
  tempC: number;
  weatherCode: string;
  dustLevel?: string;
}

const kmaItemSchema = z.object({
  baseDate: z.string(),
  baseTime: z.string(),
  category: z.string(),
  nx: z.number(),
  ny: z.number(),
  obsrValue: z.string().optional().nullable(),
  fcstValue: z.string().optional().nullable(),
}).passthrough();

const kmaResponseSchema = z.object({
  response: z.object({
    header: z.object({
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
    body: z.object({
      items: z.object({
        item: z.array(kmaItemSchema),
      }).optional().nullable(),
    }).optional().nullable(),
  }),
});

async function fetchKmaApi(url: string, query: Record<string, any>): Promise<any[]> {
  const apiKey = process.env.KMA_API_KEY || process.env.DATA_GO_KR_API_KEY || 'test-key';
  const fullQuery = {
    serviceKey: apiKey,
    dataType: 'JSON',
    ...query,
  };

  const executeCall = async () => {
    try {
      const response = await ofetch(url, {
        query: fullQuery,
        timeout: 10000,
      });

      const parsed = kmaResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw new SourceApiError('KMA', 200, false, `Zod validation failed: ${parsed.error.message}`);
      }

      const header = parsed.data.response.header;
      if (header.resultCode !== '0000') {
        throw new SourceApiError('KMA', 200, true, `KMA Error: ${header.resultMsg}`);
      }

      return parsed.data.response.body?.items?.item || [];
    } catch (error: any) {
      if (error instanceof SourceApiError) throw error;
      throw new SourceApiError('KMA', error.status || null, true, error.message || 'Network error');
    }
  };

  return retryWithBackoff(executeCall);
}

export async function getShortForecast(lat: number, lng: number): Promise<NormalizedWeather> {
  const { nx, ny } = dfsXyConv(lat, lng);
  const now = new Date();
  
  // 발표 시간 세팅 (단기예보는 02, 05, 08, 11, 14, 17, 20, 23시 발표)
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = '0500'; // 새벽 5시 예시 기준
  
  const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
  const items = await fetchKmaApi(url, {
    base_date: baseDate,
    base_time: baseTime,
    nx: nx.toString(),
    ny: ny.toString(),
    numOfRows: 50,
  });

  let tempC = 20;
  let precipProb = 0;
  let weatherCode = '0'; // 0: 맑음, 1: 구름많음, 3: 흐림 등 카테고리 정의

  for (const item of items) {
    if (item.category === 'TMP') {
      tempC = item.fcstValue ? parseFloat(item.fcstValue) : tempC;
    }
    if (item.category === 'POP') {
      precipProb = item.fcstValue ? parseInt(item.fcstValue, 10) : precipProb;
    }
    if (item.category === 'SKY') {
      weatherCode = item.fcstValue || weatherCode;
    }
  }

  return {
    tempC,
    precipProb,
    weatherCode,
  };
}

export async function getCurrentWeather(lat: number, lng: number): Promise<NormalizedWeather> {
  const { nx, ny } = dfsXyConv(lat, lng);
  const now = new Date();
  
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  // 실황은 매시간 30분에 생성되고 40분에 api 제공됨
  const hour = now.getHours();
  const baseTime = `${String(hour).padStart(2, '0')}00`;

  const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
  const items = await fetchKmaApi(url, {
    base_date: baseDate,
    base_time: baseTime,
    nx: nx.toString(),
    ny: ny.toString(),
    numOfRows: 10,
  });

  let tempC = 20;
  let pty = '0'; // 강수형태

  for (const item of items) {
    if (item.category === 'T1H') {
      tempC = item.obsrValue ? parseFloat(item.obsrValue) : tempC;
    }
    if (item.category === 'PTY') {
      pty = item.obsrValue || pty;
    }
  }

  return {
    tempC,
    precipProb: pty !== '0' ? 80 : 0, // 비가 오면 강수 확률 임시 매핑
    weatherCode: pty, // PTY 코드값으로 강수 형태 리턴
  };
}

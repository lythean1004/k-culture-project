// 다국어 유틸 및 번역 표기사전 맵핑 유틸
export const GLOSSARY: Record<string, Record<string, string>> = {
  "Gyeongbokgung": {
    "ko": "경복궁",
    "en": "Gyeongbokgung Palace",
    "ja": "景福宮",
    "zh-Hans": "景福宫",
    "zh-Hant": "景福宮"
  },
  "National Museum of Korea": {
    "ko": "국립중앙박물관",
    "en": "National Museum of Korea",
    "ja": "国立中央博物館",
    "zh-Hans": "国立中央博物馆",
    "zh-Hant": "國立中央博物館"
  }
};

export function getLocalizedName(key: string, locale: 'en' | 'ja' | 'zh-Hans' | 'zh-Hant' | 'ko'): string {
  const item = GLOSSARY[key];
  if (!item) return key;
  return item[locale] || item['en'] || key;
}

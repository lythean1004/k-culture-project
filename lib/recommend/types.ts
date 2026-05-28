export type ThemeCode =
  | 'HISTORY'
  | 'TRADITIONAL_MUSIC'
  | 'MODERN_ART'
  | 'FAMILY'
  | 'NIGHT'
  | 'WELLNESS'
  | 'FOOD'
  | 'FESTIVAL';

export type VisitForm = 'DAY_TRIP' | 'STAY_1_3' | 'THEME_TOUR';

export interface RecommendInput {
  sessionId?: string;
  cityCode: string;
  visitForm: VisitForm;
  interests: ThemeCode[];
  freeTextQuery?: string;          // 자유 텍스트 입력 (임베딩 매칭용)
  lang: 'en' | 'ja' | 'zh-Hans' | 'zh-Hant';
  transportMode: 'WALK' | 'TRANSIT' | 'CAR';
  currentLocation?: { lat: number; lng: number };
  startTimePref?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  date?: string;
}

export interface Candidate {
  id: string;
  entityType: 'PLACE' | 'EVENT';
  primaryType: string;
  subType?: string;
  nameKo: string;
  nameI18n?: Record<string, string>;
  lat?: number;
  lng?: number;
  qualityGrade: 'A' | 'B' | 'B_MINUS' | 'C';
  officialUrl?: string;
  phone?: string;
  source: string;
  semanticSimilarity?: number;
  themes: ThemeCode[];
  indoorOutdoor?: 'INDOOR' | 'OUTDOOR' | 'MIXED' | string;
}

export interface RecommendContext {
  now: Date;
  weather?: string;
  anchorPlaces: Array<{ lat: number; lng: number }>;
}

export interface ScoreWeights {
  interest: number;
  language: number;
  mobility: number;
  time: number;
  weather: number;
  operating: number;
  proximity: number;
  cohesion: number;
}

export interface ScoreBreakdown {
  interestMatch: number;
  langFit: number;
  mobilityFit: number;
  timeFit: number;
  weatherFit: number;
  operatingFit: number;
  proximityFit: number;
}

export interface ScoredCandidate extends Candidate {
  score: {
    total: number;
    breakdown: ScoreBreakdown;
  };
}

export interface PackageItem {
  id: string;
  itemType: 'PLACE' | 'EVENT';
  refId: string;
  name: string;
  lat?: number;
  lng?: number;
  slotType: 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  nameKo?: string;
  nameI18n?: Record<string, string>;
  primaryType?: string;
}

export interface RecommendedPackage {
  packageId: string;
  themeCode: ThemeCode;
  title: string;
  summary: string;
  reasonText: string;
  items: PackageItem[];
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  weatherFallback?: PackageItem[];
  cityName?: string;
  durationHours?: number;
  reasonTextSource?: 'LLM_GENERATED' | 'TEMPLATE_FALLBACK';
}

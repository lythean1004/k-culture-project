export type SourceName = 
  | 'TOURAPI'
  | 'MUSEUM_STD'
  | 'KOPIS'
  | 'EMUSEUM'
  | 'CULTURE_DATA'
  | 'KMA'
  | 'MANUAL';

export type PlacePrimaryType =
  | 'MUSEUM'
  | 'ART_GALLERY'
  | 'ATTRACTION'
  | 'TEMPLE'
  | 'MARKET'
  | 'NATURE'
  | 'PERFORMANCE_VENUE'
  | 'HISTORIC_SITE';

export type EventType = 'PERFORMANCE' | 'EXHIBITION' | 'FESTIVAL';

export type EventGenre =
  | 'TRADITIONAL_MUSIC'
  | 'DANCE'
  | 'MUSICAL'
  | 'CLASSICAL'
  | 'NON_VERBAL'
  | 'MODERN_ART'
  | 'ETC';

export interface NormalizedPlace {
  sourceName: SourceName;
  sourcePlaceId: string;
  primaryType: PlacePrimaryType;
  subType?: string;
  nameKo?: string;
  nameI18n?: Array<{ lang: string; name: string; shortDesc?: string; longDesc?: string }>;
  addrKo?: string;
  lat?: number;
  lng?: number;
  officialUrl?: string;
  phone?: string;
  indoorOutdoor?: 'INDOOR' | 'OUTDOOR' | 'MIXED';
  rawJson: any;
}

export interface NormalizedEvent {
  sourceName: SourceName;
  sourceEventId: string;
  eventType: EventType;
  titleKo: string;
  titleI18n?: Array<{ lang: string; title: string }>;
  venueName?: string;            // 매칭용
  venueAddr?: string;
  genre?: EventGenre;
  officialUrl?: string;
  reservationUrl?: string;
  posterUrl?: string;
  foreignerFriendly: boolean;
  sessions: Array<{ startAt: Date; endAt?: Date; runtimeMin?: number }>;
  rawJson: any;
}

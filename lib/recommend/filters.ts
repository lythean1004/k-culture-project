import { Candidate, RecommendContext, RecommendInput } from './types';

const MAX_DISTANCE_BY_MODE: Record<'WALK' | 'TRANSIT' | 'CAR', number> = {
  WALK: 2.0,      // 2km
  TRANSIT: 15.0,  // 15km
  CAR: 50.0,      // 50km
};

function haversine(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isOperatingNow(candidate: Candidate, now: Date): boolean {
  const day = now.getDay();
  // Simple heuristic: museums and art galleries are typically closed on Mondays (1)
  if ((candidate.primaryType === 'MUSEUM' || candidate.primaryType === 'ART_GALLERY') && day === 1) {
    return false;
  }
  return true;
}

export function applyFilters(
  candidates: Candidate[],
  input: RecommendInput,
  context: RecommendContext
): Candidate[] {
  return candidates.filter(c => {
    // 1. Operating hours check
    if (!isOperatingNow(c, context.now)) return false;
    
    // 2. Transport mode distance boundary check
    if (input.currentLocation && c.lat && c.lng) {
      const dist = haversine(input.currentLocation, { lat: c.lat, lng: c.lng });
      const maxDist = MAX_DISTANCE_BY_MODE[input.transportMode];
      if (dist > maxDist) return false;
    }
    
    return true;
  });
}

import { Candidate, RecommendContext, RecommendInput, ScoreBreakdown, ScoreWeights, VisitForm } from './types';

const WEIGHTS: Record<VisitForm, ScoreWeights> = {
  DAY_TRIP:   { interest: 20, language: 10, mobility: 12, time: 10, 
                weather: 8, operating: 18, proximity: 17, cohesion: 5 },
  STAY_1_3:   { interest: 22, language: 12, mobility: 10, time: 8, 
                weather: 8, operating: 13, proximity: 10, cohesion: 17 },
  THEME_TOUR: { interest: 24, language: 12, mobility: 10, time: 8, 
                weather: 8, operating: 10, proximity: 8, cohesion: 20 },
};

const LANG_QUALITY = { A: 1.0, B: 0.8, B_MINUS: 0.65, C: 0.2 };

function haversine(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number {
  const R = 6371;
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

function calcInterestMatch(candidate: Candidate, interests: string[]): number {
  if (interests.length === 0) return 1.0;
  const matches = candidate.themes.filter(t => interests.includes(t));
  return matches.length / interests.length;
}

function calcMobilityFit(candidate: Candidate, input: RecommendInput, context: RecommendContext): number {
  if (input.transportMode === 'WALK' && input.currentLocation && candidate.lat && candidate.lng) {
    const dist = haversine(input.currentLocation, { lat: candidate.lat, lng: candidate.lng });
    return dist < 1.0 ? 1.0 : dist < 2.0 ? 0.5 : 0.1;
  }
  return 1.0;
}

function calcTimeFit(candidate: Candidate, now: Date): number {
  return 1.0;
}

function calcWeatherFit(candidate: Candidate, weather?: string): number {
  if (weather === 'Rainy' && candidate.indoorOutdoor === 'OUTDOOR') {
    return 0.2;
  }
  return 1.0;
}

function isOperatingFor120min(candidate: Candidate, now: Date): number {
  return 1.0;
}

function calcProximity(candidate: Candidate, anchors: Array<{ lat: number; lng: number }>): number {
  if (anchors.length === 0) return 1.0;
  if (!candidate.lat || !candidate.lng) return 0.5;
  const dist = haversine(anchors[0], { lat: candidate.lat, lng: candidate.lng });
  return dist < 2.0 ? 1.0 : dist < 5.0 ? 0.7 : dist < 10.0 ? 0.4 : 0.1;
}

export function scoreCandidate(
  candidate: Candidate,
  input: RecommendInput,
  context: RecommendContext
): { total: number; breakdown: ScoreBreakdown } {
  const w = WEIGHTS[input.visitForm];
  
  const interestMatch = calcInterestMatch(candidate, input.interests) * w.interest;
  const langFit = LANG_QUALITY[candidate.qualityGrade] * w.language;
  const mobilityFit = calcMobilityFit(candidate, input, context) * w.mobility;
  const timeFit = calcTimeFit(candidate, context.now) * w.time;
  const weatherFit = calcWeatherFit(candidate, context.weather) * w.weather;
  const operatingFit = isOperatingFor120min(candidate, context.now) * w.operating;
  const proximityFit = calcProximity(candidate, context.anchorPlaces) * w.proximity;
  
  const total = interestMatch + langFit + mobilityFit + timeFit + 
                weatherFit + operatingFit + proximityFit;
  
  return {
    total,
    breakdown: { 
      interestMatch, 
      langFit, 
      mobilityFit, 
      timeFit, 
      weatherFit, 
      operatingFit, 
      proximityFit 
    }
  };
}

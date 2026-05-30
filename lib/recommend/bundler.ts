import { RecommendedPackage, ScoredCandidate, RecommendInput, PackageItem, ThemeCode } from './types';
import { cityScopeSlug, dayCountFromVisitForm, formatCityScope, normalizeCityCodes } from './cities';

const DAY_SLOTS: PackageItem['slotType'][] = ['MORNING', 'LUNCH', 'AFTERNOON', 'EVENING'];

export function bundlePackages(
  scored: ScoredCandidate[],
  input: RecommendInput
): RecommendedPackage[] {
  return bundleCourseItineraries(scored, input);
}

function bundleCourseItineraries(scored: ScoredCandidate[], input: RecommendInput): RecommendedPackage[] {
  const themes = input.interests.length > 0 ? input.interests : ['HISTORY' as ThemeCode];
  const selectedCityCodes = normalizeCityCodes(input.cityCode, input.cityCodes);
  const dayCount = Math.max(
    dayCountFromVisitForm(input.visitForm, input.tripDays),
    Math.min(selectedCityCodes.length, 3)
  ) as 1 | 2 | 3;
  const scopeLabel = formatCityScope(selectedCityCodes).toUpperCase();
  const scopeSlug = cityScopeSlug(selectedCityCodes);
  const packages: RecommendedPackage[] = [];

  themes.forEach((theme, index) => {
    const usedKeys = new Set<string>();
    const items: PackageItem[] = [];

    for (let day = 1; day <= dayCount; day += 1) {
      const cityCode = selectedCityCodes[(day - 1) % selectedCityCodes.length];
      const dayCandidates = selectDayCandidates(scored, theme, cityCode, usedKeys);

      dayCandidates.forEach((candidate, slotIndex) => {
        usedKeys.add(candidateKey(candidate));
        items.push(candidateToPackageItem(candidate, day, DAY_SLOTS[slotIndex] || 'EVENING'));
      });
    }

    if (items.length === 0) return;

    const firstScored = scored.find(candidate => candidate.id === items[0].refId);
    const totalScore = items.reduce((acc, item) => {
      const candidateScore = scored.find(candidate => candidate.id === item.refId)?.score.total || 0;
      return acc + candidateScore;
    }, 0);

    packages.push({
      packageId: `pkg-${dayCount}d-${scopeSlug}-${theme.toLowerCase()}-${index}`,
      themeCode: theme,
      title: `${dayCount}-Day ${theme} Course in ${scopeLabel}`,
      summary: buildCourseSummary(dayCount, selectedCityCodes),
      reasonText: `Customized for your interest in ${theme}.`,
      items,
      totalScore,
      scoreBreakdown: firstScored?.score.breakdown || scored[0]?.score.breakdown,
      cityName: scopeLabel,
      cityCodes: selectedCityCodes,
      dayCount,
      routeLabel: buildRouteLabel(dayCount, selectedCityCodes),
      durationHours: dayCount * 8,
    });
  });

  return packages.slice(0, 5);
}

function selectDayCandidates(
  scored: ScoredCandidate[],
  theme: ThemeCode,
  cityCode: string,
  usedKeys: Set<string>
): ScoredCandidate[] {
  const cityCandidates = scored.filter(candidate => candidate.cityCode === cityCode);
  const themedPlaces = cityCandidates.filter(candidate =>
    candidate.entityType === 'PLACE' &&
    candidate.themes.includes(theme) &&
    !usedKeys.has(candidateKey(candidate))
  );
  const restaurants = cityCandidates.filter(candidate =>
    candidate.entityType === 'PLACE' &&
    candidate.themes.includes('FOOD') &&
    !usedKeys.has(candidateKey(candidate))
  );
  const events = cityCandidates.filter(candidate =>
    candidate.entityType === 'EVENT' &&
    !usedKeys.has(candidateKey(candidate))
  );
  const fallbackPlaces = cityCandidates.filter(candidate =>
    candidate.entityType === 'PLACE' &&
    !usedKeys.has(candidateKey(candidate))
  );
  const selected: ScoredCandidate[] = [];

  pickNext(selected, themedPlaces);
  pickNext(selected, restaurants, fallbackPlaces);
  pickNext(selected, themedPlaces, fallbackPlaces);
  pickNext(selected, events, themedPlaces, fallbackPlaces);

  return selected.slice(0, DAY_SLOTS.length);
}

function pickNext(selected: ScoredCandidate[], ...pools: ScoredCandidate[][]): void {
  for (const pool of pools) {
    const candidate = pool.find(item => !selected.some(selectedItem => candidateKey(selectedItem) === candidateKey(item)));
    if (candidate) {
      selected.push(candidate);
      return;
    }
  }
}

function candidateToPackageItem(candidate: ScoredCandidate, dayNumber: number, slotType: PackageItem['slotType']): PackageItem {
  return {
    id: `item-${candidate.id}-d${dayNumber}-${slotType.toLowerCase()}`,
    itemType: candidate.entityType,
    refId: candidate.id,
    name: candidate.nameKo,
    dayNumber,
    cityCode: candidate.cityCode,
    lat: candidate.lat,
    lng: candidate.lng,
    slotType,
    nameKo: candidate.nameKo,
    nameI18n: candidate.nameI18n,
    primaryType: candidate.primaryType,
    source: candidate.source,
  };
}

function candidateKey(candidate: ScoredCandidate): string {
  return `${candidate.entityType}:${candidate.id}`;
}

function buildCourseSummary(dayCount: number, cityCodes: string[]): string {
  const cityList = formatCityScope(cityCodes);
  return `${dayCount} concrete day-by-day route covering ${cityList}.`;
}

function buildRouteLabel(dayCount: number, cityCodes: string[]): string {
  const dayCities = Array.from({ length: dayCount }, (_, index) => {
    const cityCode = cityCodes[index % cityCodes.length];
    return `Day ${index + 1}: ${formatCityScope([cityCode])}`;
  });

  return dayCities.join(' / ');
}

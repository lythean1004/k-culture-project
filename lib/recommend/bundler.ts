import { RecommendedPackage, ScoredCandidate, RecommendInput, PackageItem, ThemeCode } from './types';

export function bundlePackages(
  scored: ScoredCandidate[],
  input: RecommendInput
): RecommendedPackage[] {
  switch (input.visitForm) {
    case 'DAY_TRIP':
      return bundleDayTrip(scored, input);
    case 'STAY_1_3':
      return bundleStay(scored, input);
    case 'THEME_TOUR':
      return bundleThemeTour(scored, input);
    default:
      return bundleDayTrip(scored, input);
  }
}

function bundleDayTrip(scored: ScoredCandidate[], input: RecommendInput): RecommendedPackage[] {
  const themes = input.interests.length > 0 ? input.interests : ['HISTORY' as ThemeCode];
  const packages: RecommendedPackage[] = [];

  themes.forEach((theme, index) => {
    const themePlaces = scored.filter(c => c.entityType === 'PLACE' && c.themes.includes(theme));
    const themeEvents = scored.filter(c => c.entityType === 'EVENT');

    if (themePlaces.length === 0) return;

    const items: PackageItem[] = [];
    
    // Anchor place (morning slot)
    const anchor = themePlaces[0];
    items.push({
      id: `item-${anchor.id}-morning`,
      itemType: 'PLACE',
      refId: anchor.id,
      name: anchor.nameKo,
      lat: anchor.lat,
      lng: anchor.lng,
      slotType: 'MORNING',
      nameKo: anchor.nameKo,
      nameI18n: anchor.nameI18n,
      primaryType: anchor.primaryType,
    });

    // Sub place (afternoon slot)
    const sub = themePlaces[1] || scored.find(c => c.entityType === 'PLACE' && c.id !== anchor.id);
    if (sub) {
      items.push({
        id: `item-${sub.id}-afternoon`,
        itemType: 'PLACE',
        refId: sub.id,
        name: sub.nameKo,
        lat: sub.lat,
        lng: sub.lng,
        slotType: 'AFTERNOON',
        nameKo: sub.nameKo,
        nameI18n: sub.nameI18n,
        primaryType: sub.primaryType,
      });
    }

    // Event/Performance (evening slot)
    const event = themeEvents[0] || scored.find(c => c.entityType === 'EVENT');
    if (event) {
      items.push({
        id: `item-${event.id}-evening`,
        itemType: 'EVENT',
        refId: event.id,
        name: event.nameKo,
        lat: event.lat,
        lng: event.lng,
        slotType: 'EVENING',
        nameKo: event.nameKo,
        nameI18n: event.nameI18n,
        primaryType: event.primaryType,
      });
    }

    packages.push({
      packageId: `pkg-day-${theme.toLowerCase()}-${index}`,
      themeCode: theme,
      title: `${theme} Curated One-Day Course`,
      summary: `A special day course focusing on ${theme} in ${input.cityCode.toUpperCase()}.`,
      reasonText: `Customized for your interest in ${theme}.`,
      items,
      totalScore: anchor.score.total + (sub ? sub.score.total : 0) + (event ? event.score.total : 0),
      scoreBreakdown: anchor.score.breakdown,
      cityName: input.cityCode.toUpperCase(),
      durationHours: 8,
    });
  });

  return packages.slice(0, 5);
}

function bundleStay(scored: ScoredCandidate[], input: RecommendInput): RecommendedPackage[] {
  const packages: RecommendedPackage[] = [];
  const themes = input.interests.length > 0 ? input.interests : ['HISTORY' as ThemeCode];

  themes.forEach((theme, index) => {
    const themePlaces = scored.filter(c => c.entityType === 'PLACE' && c.themes.includes(theme));
    if (themePlaces.length < 2) return;

    const items: PackageItem[] = [
      {
        id: `item-${themePlaces[0].id}-d1-morning`,
        itemType: 'PLACE',
        refId: themePlaces[0].id,
        name: themePlaces[0].nameKo,
        lat: themePlaces[0].lat,
        lng: themePlaces[0].lng,
        slotType: 'MORNING',
        nameKo: themePlaces[0].nameKo,
        nameI18n: themePlaces[0].nameI18n,
        primaryType: themePlaces[0].primaryType,
      },
      {
        id: `item-${themePlaces[1].id}-d2-afternoon`,
        itemType: 'PLACE',
        refId: themePlaces[1].id,
        name: themePlaces[1].nameKo,
        lat: themePlaces[1].lat,
        lng: themePlaces[1].lng,
        slotType: 'AFTERNOON',
        nameKo: themePlaces[1].nameKo,
        nameI18n: themePlaces[1].nameI18n,
        primaryType: themePlaces[1].primaryType,
      }
    ];

    packages.push({
      packageId: `pkg-stay-${theme.toLowerCase()}-${index}`,
      themeCode: theme,
      title: `${theme} Weekend Stay in ${input.cityCode.toUpperCase()}`,
      summary: `Relaxing staying itinerary exploring ${theme}.`,
      reasonText: `Curated stay for ${theme} lovers.`,
      items,
      totalScore: themePlaces[0].score.total + themePlaces[1].score.total,
      scoreBreakdown: themePlaces[0].score.breakdown,
      cityName: input.cityCode.toUpperCase(),
      durationHours: 36,
    });
  });

  return packages.slice(0, 3);
}

function bundleThemeTour(scored: ScoredCandidate[], input: RecommendInput): RecommendedPackage[] {
  const packages: RecommendedPackage[] = [];
  const themes = input.interests.length > 0 ? input.interests : ['HISTORY' as ThemeCode];

  themes.forEach((theme, index) => {
    const themePlaces = scored.filter(c => c.entityType === 'PLACE' && c.themes.includes(theme));
    if (themePlaces.length === 0) return;

    const items: PackageItem[] = themePlaces.slice(0, 4).map((p, idx) => ({
      id: `item-${p.id}-slot-${idx}`,
      itemType: 'PLACE',
      refId: p.id,
      name: p.nameKo,
      lat: p.lat,
      lng: p.lng,
      slotType: idx === 0 ? 'MORNING' : idx === 1 ? 'LUNCH' : idx === 2 ? 'AFTERNOON' : 'EVENING',
      nameKo: p.nameKo,
      nameI18n: p.nameI18n,
      primaryType: p.primaryType,
    }));

    packages.push({
      packageId: `pkg-theme-${theme.toLowerCase()}-${index}`,
      themeCode: theme,
      title: `Deep Dive: ${theme} Tour`,
      summary: `An intensive historical/cultural deep-dive package.`,
      reasonText: `Specifically optimized for ${theme} theme.`,
      items,
      totalScore: items.reduce((acc, curr) => acc + (scored.find(s => s.id === curr.refId)?.score.total || 0), 0),
      scoreBreakdown: themePlaces[0].score.breakdown,
      cityName: input.cityCode.toUpperCase(),
      durationHours: 12,
    });
  });

  return packages.slice(0, 3);
}

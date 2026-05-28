export function bundlePackage(scoredPlaces: any[], events: any[]) {
  // 장소들과 공연/전시를 하나의 코스(타임라인) 패키지로 번들링
  console.log(`Bundling package with ${scoredPlaces.length} places and ${events.length} events`);
  
  return {
    id: `pkg-${Date.now()}`,
    theme: "Traditional Heritage Discovery",
    timeline: scoredPlaces.map((place, index) => ({
      step: index + 1,
      time: index === 0 ? "10:00" : "14:00",
      placeId: place.id,
      nameKo: place.nameKo,
      category: place.category
    })),
    events: events.map(e => ({
      id: e.id,
      titleKo: e.titleKo,
      time: "19:00"
    }))
  };
}

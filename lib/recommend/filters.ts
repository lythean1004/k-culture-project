export function filterCandidates(candidates: any, filters: { weatherCondition?: string }) {
  // 날씨 조건이나 특정 상황(예: 야외활동 불가 등)에 맞는 필터링
  console.log(`Filtering candidates with condition: ${filters.weatherCondition}`);
  
  if (filters.weatherCondition === 'Rainy') {
    // 비올 때는 실내(museum 등) 위주로 필터링하는 로직 예시
    return {
      ...candidates,
      places: candidates.places.filter((p: any) => p.category === 'museum')
    };
  }
  
  return candidates;
}

export function scoreCandidates(candidates: any, interests: string[]) {
  // 각 후보의 매칭도 점수 계산
  console.log(`Scoring candidates based on interests: ${interests.join(', ')}`);
  
  return candidates.places.map((place: any) => {
    let score = 0;
    
    // 임시 점수 계산 로직
    if (interests.includes('History') && place.category === 'attraction') {
      score += 10;
    }
    if (interests.includes('Art') && place.category === 'museum') {
      score += 8;
    }
    
    return {
      ...place,
      score
    };
  }).sort((a: any, b: any) => b.score - a.score);
}
